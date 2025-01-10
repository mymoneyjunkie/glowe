const express = require("express");

// const axios = require("axios");

const fetch = require('node-fetch');
global.fetch = fetch;

const { initializeApp } = require("firebase/app");
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  deleteUser,
  signInWithEmailAndPassword  
} = require("firebase/auth");

const { body, validationResult } = require("express-validator");

const router = express.Router();

const firebaseConfig = {
  apiKey: "AIzaSyDhQzFaMfMbj1A6Rl0BV-26M5JYroRssWg",
  authDomain: "glowbal-network.firebaseapp.com",
  projectId: "glowbal-network",
  storageBucket: "glowbal-network.firebasestorage.app",
  messagingSenderId: "662762176183",
  appId: "1:662762176183:web:06adb93263fd8ac8d35732",
  measurementId: "G-7E907KBMVE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

// async function sendVerificationEmail(email, password) {
//   try {
//     // Create user with email and password using the modular SDK
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     const actionCodeSettings = {
//       url: `https://member.glowbal.co.uk/home?m=${email}`,
//       handleCodeInApp: true
//     };
    
//     // Send verification email - pass both user and actionCodeSettings
//     await sendEmailVerification(user, actionCodeSettings);
    
//     console.log('Verification email sent successfully');
//     return true;
//   } catch (error) {
//     console.log('Error sending verification email:', error);
//     throw error;
//   }
// }


async function sendVerificationEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    try {
      const actionCodeSettings = {
        url: `https://member.glowbal.co.uk/home?m=${email}`,
        handleCodeInApp: true
      };
      
      await sendEmailVerification(user, actionCodeSettings);
      
      return {
        success: true,
        userId: user.uid
      };
    } catch (verificationError) {
      console.log('Error sending verification email:', verificationError);
      await deleteUser(user);
      throw new Error('Failed to send verification email. User registration rolled back.');
    }
  } catch (error) {
    if (error.message === 'Firebase: Error (auth/email-already-in-use).') {
      try {
        // First sign in with the existing email/password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const existingUser = userCredential.user;
        
        // Now we can delete the user
        if (existingUser) {
          await deleteUser(existingUser);
          console.log('Existing user deleted successfully');
          
          // Try to create the new user again
          return await sendVerificationEmail(email, password);
        }
      } catch (signInError) {
        console.log('Error signing in to delete user:', signInError);
        throw new Error('Cannot delete existing user - incorrect password or user not accessible');
      }
    }
    throw error;
  }
}

router.get("/", async (req, res, next) => {
	try {
		return res.send("hii...");
	}

	catch (error) {
		console.log(error);

		return res.send("error...");
	}
})

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // console.log(email, password);

  	try {
	    const result = await sendVerificationEmail(email, password);
	    res.status(200).json({ 
	      message: 'Verification email sent successfully',
	      userId: result.userId 
	    });
  	} 
  	catch (error) {
	    if (error.message === 'Firebase: Error (auth/email-already-in-use).') {
	      return res.status(400).json({ 
	        error: 'Email is already registered',
	        message: 'Please try with a different password for this email or use a different email address'
	      });
	    }
    	res.status(500).json({ error: error.message });
  	}
});

module.exports = router;
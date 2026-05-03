// DOM Elements - Login
const loginSection = document.getElementById('loginSection');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const loginBtn = document.getElementById('loginBtn');
const statusMessage = document.getElementById('statusMessage');
const showSignupBtn = document.getElementById('showSignup');

// DOM Elements - Signup
const signupSection = document.getElementById('signupSection');
const signupForm = document.getElementById('signupForm');
const signupUsernameInput = document.getElementById('signupUsername');
const signupPasswordInput = document.getElementById('signupPassword');
const toggleSignupPasswordBtn = document.getElementById('toggleSignupPassword');
const signupBtn = document.getElementById('signupBtn');
const signupStatusMessage = document.getElementById('signupStatusMessage');
const showLoginBtn = document.getElementById('showLogin');

// Load remembered user on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('rememberedUser');
    if (savedName) {
        usernameInput.value = savedName;
    }
});

// Toggle visibility between Login and Signup sections
showSignupBtn.addEventListener('click', () => {
    loginSection.style.display = 'none';
    signupSection.style.display = 'block';
    signupForm.reset();
    signupStatusMessage.className = 'message';
    signupStatusMessage.textContent = '';
});

showLoginBtn.addEventListener('click', () => {
    signupSection.style.display = 'none';
    loginSection.style.display = 'block';
    loginForm.reset();
    statusMessage.className = 'message';
    statusMessage.textContent = '';
});

// Toggle Password Visibility Logic
function togglePasswordVisibility(inputObj, toggleBtn) {
    const type = inputObj.getAttribute('type') === 'password' ? 'text' : 'password';
    inputObj.setAttribute('type', type);
    if (type === 'text') {
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

togglePasswordBtn.addEventListener('click', () => togglePasswordVisibility(passwordInput, togglePasswordBtn));
toggleSignupPasswordBtn.addEventListener('click', () => togglePasswordVisibility(signupPasswordInput, toggleSignupPasswordBtn));

// Sign Up Submission Logic
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    signupStatusMessage.className = 'message';
    
    const newUsername = signupUsernameInput.value.trim();
    const newPassword = signupPasswordInput.value;

    if (newUsername === '' || newPassword === '') {
        showMsg(signupStatusMessage, 'error', 'Please fill in all fields.');
        return;
    }

    setLoadingState(signupBtn, true, 'Signing Up');

    try {
        // Check if username already exists using a query (more efficient)
        const snapshot = await db.collection('users').where('username', '==', newUsername).get();
        const userExists = !snapshot.empty;
        
        if (userExists) {
            setLoadingState(signupBtn, false, 'Sign Up', 'fa-user-plus');
            showMsg(signupStatusMessage, 'error', 'Username already exists!');
        } else {
            // Save new user via Firebase
            await db.collection('users').add({ username: newUsername, password: newPassword });
            
            setLoadingState(signupBtn, false, 'Sign Up', 'fa-user-plus');
            showMsg(signupStatusMessage, 'success', 'Account created! Redirecting to login...');
            
            // Switch back to login after short delay
            setTimeout(() => {
                showLoginBtn.click();
                usernameInput.value = newUsername; // Prefill the username for them
            }, 1000);
        }
    } catch (error) {
        console.error("Firebase Signup Error:", error);
        setLoadingState(signupBtn, false, 'Sign Up', 'fa-user-plus');
        showMsg(signupStatusMessage, 'error', error.message || 'Database connection error.');
    }
});

// Login Submission Logic
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusMessage.className = 'message';

    const usernameValue = usernameInput.value.trim();
    const passwordValue = passwordInput.value;

    if (usernameValue === '' || passwordValue === '') {
        showMsg(statusMessage, 'error', 'Please fill in all fields.');
        return;
    }

    setLoadingState(loginBtn, true, 'Authenticating');

    try {
        // Fetch registered users from Firebase matching the username
        const snapshot = await db.collection('users').where('username', '==', usernameValue).get();
        
        let validUser = null;
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0].data();
            // Check if password matches
            if (userDoc.password === passwordValue) {
                validUser = userDoc;
            }
        }

        setLoadingState(loginBtn, false, 'Sign In', 'fa-arrow-right');

        // Accept 'admin' default or checking DB
        if ((usernameValue.toLowerCase() === 'admin' && passwordValue === 'password') || validUser) {
            
            const detectedUser = validUser ? validUser.username : 'admin';

            // Save for local persistence of auth
            localStorage.setItem('rememberedUser', detectedUser);
            localStorage.setItem('loggedInUser', detectedUser.toLowerCase());

            showMsg(statusMessage, 'success', 'Login successful! Redirecting...');
            
            setTimeout(() => {
                // Redirect logic based on role
                if (detectedUser.toLowerCase() === 'admin') {
                     window.location.href = 'admin.html'; 
                } else {
                     window.location.href = 'page.html'; 
                }
            }, 500);
        } else {
            showMsg(statusMessage, 'error', 'Invalid username or password.');
        }
    } catch (error) {
        console.error("Firebase Login Error:", error);
        setLoadingState(loginBtn, false, 'Sign In', 'fa-arrow-right');
        showMsg(statusMessage, 'error', error.message || 'Database connection error.');
    }
});

// Helper function to handle UI loading state
function setLoadingState(btn, isLoading, text, iconClass = '') {
    if (isLoading) {
        btn.disabled = true;
        btn.classList.add('loading');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>${text}...</span>`;
    } else {
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.innerHTML = `<span>${text}</span><i class="fas ${iconClass}"></i>`;
    }
}

// Helper function to display messages
function showMsg(element, type, text) {
    element.className = `message ${type}`;
    element.textContent = text;
}

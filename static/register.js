let captchaId;

window.addEventListener('load', () => {
    fetch('/captcha')
        .then(response => response.json())
        .then(data => {
            captchaId = data.captchaId;
            const captchaImg = document.getElementById('captcha-image');
            captchaImg.src = data.captchaImage;
        })
        .catch(error => console.error('Error:', error));
});

document.getElementById('register-form').addEventListener('submit', (event) => {
    // Prevent the form from being submitted normally
    event.preventDefault();

    // Get form data
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const repeatPassword = document.getElementById('repeat-password').value;
    const captchaText = document.getElementById('captcha').value;

    if (password !== repeatPassword) {
        alert('Passwords do not match.');
        return;
    }

    // Send form data to server
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, captchaId, captchaText }),
    })
        .then(response => response.json())
        .then(data => {
            // Handle response from server
            if (data.success) {
                alert('Registration successful!');
                window.location.href = '/login';
            } else {
                alert('Registration failed: ' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});

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

document.getElementById('login-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const captchaText = document.getElementById('captcha').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, captchaId, captchaText }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('token', data.token);
                alert('Login successful!');
                window.location.href = '/update';
            }
            else {
                alert('Login failed: ' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});
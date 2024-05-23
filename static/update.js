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

document.getElementById('update-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const captchaText = document.getElementById('captcha').value;

    fetch('/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ newUsername, newPassword, captchaId, captchaText })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('token', data.token);
                alert('User updated successfully');
            } else {
                alert('Error updating user: ' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});
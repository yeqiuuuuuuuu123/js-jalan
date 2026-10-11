const API_BASE =
  window.location.origin;

const CHANGE_PASSWORD_API =
  `${API_BASE}/api/auth/change-password`;

document
  .getElementById("changePasswordForm")
  .addEventListener("submit", changePassword);

async function changePassword(e) {
  e.preventDefault();

  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const message = document.getElementById("message");

  const token = localStorage.getItem("token");

  if (!oldPassword || !newPassword) {
    message.innerText = "Semua field wajib diisi";
    return;
  }

  if (newPassword.length < 6) {
    message.innerText = "Password minimal 6 karakter";
    return;
  }

  try {
       const response = await fetch(
          CHANGE_PASSWORD_API,
        {
          method: "PUT",
           headers: {
          "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
           body: JSON.stringify({
            oldPassword,
            newPassword
     })
    }
    );

    const data = await response.json();

    if (response.ok) {
      message.style.color = "lightgreen";
      message.innerText = "Password berhasil diganti";

      document.getElementById("changePasswordForm").reset();

    } else {
      message.style.color = "red";
      message.innerText = data.message || "Gagal ganti password";
    }

  } catch (err) {
    message.style.color = "red";
    message.innerText = "Server error";
  }
}
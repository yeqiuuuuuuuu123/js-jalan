const API_BASE =
  window.location.origin;

const oldPassword =
  document.getElementById(
    "oldPassword"
  );

const newPassword =
  document.getElementById(
    "newPassword"
  );

const confirmPassword =
  document.getElementById(
    "confirmPassword"
  );

const changeBtn =
  document.getElementById(
    "changeBtn"
  );

const message =
  document.getElementById(
    "message"
  );

const token =
  localStorage.getItem(
    "token"
  );

/* =========================
   CEK LOGIN
========================= */

if(!token){

  window.location.href =
    "login.html";

}

/* =========================
   CHANGE PASSWORD
========================= */

changeBtn.addEventListener(

  "click",

  async () => {

    const oldPass =
      oldPassword.value.trim();

    const newPass =
      newPassword.value.trim();

    const confirmPass =
      confirmPassword.value.trim();

    /* =========================
       VALIDASI
    ========================= */

    if(
      !oldPass ||
      !newPass ||
      !confirmPass
    ){

      message.style.color =
        "#ff6b6b";

      message.innerText =
        "Semua field wajib diisi";

      return;

    }

    if(
      newPass.length < 6
    ){

      message.style.color =
        "#ff6b6b";

      message.innerText =
        "Password minimal 6 karakter";

      return;

    }

    if(
      newPass !== confirmPass
    ){

      message.style.color =
        "#ff6b6b";

      message.innerText =
        "Konfirmasi password tidak cocok";

      return;

    }

    try{

      changeBtn.disabled =
        true;

      changeBtn.innerText =
        "Memproses...";

      const response =
        await fetch(

          `${API_BASE}/api/auth/change-password`,

          {

            method:"PUT",

            headers:{

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`

            },

            body:
              JSON.stringify({

                oldPassword:
                  oldPass,

                newPassword:
                  newPass

              })

          }

        );

      const data =
        await response.json();

      if(
        response.ok
      ){

        message.style.color =
          "#00f5c3";

        message.innerText =
          data.message ||
          "Password berhasil diperbarui";

        oldPassword.value =
          "";

        newPassword.value =
          "";

        confirmPassword.value =
          "";

        setTimeout(() => {

          window.location.href =
            "my-account.html";

        }, 1200);

      }
      else{

        message.style.color =
          "#ff6b6b";

        message.innerText =
          data.message ||
          "Gagal mengganti password";

      }

    }
    catch(error){

      console.error(error);

      message.style.color =
        "#ff6b6b";

      message.innerText =
        "Server error";

    }
    finally{

      changeBtn.disabled =
        false;

      changeBtn.innerText =
        "Ubah Password";

    }

  }

);
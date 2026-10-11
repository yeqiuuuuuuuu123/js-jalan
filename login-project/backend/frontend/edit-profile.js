const usernameInput =
  document.getElementById("username");

const emailInput =
  document.getElementById("email");

const saveBtn =
  document.getElementById("saveBtn");

const message =
  document.getElementById("message");

const avatarPreview =
  document.getElementById("avatarPreview");

const photoInput =
  document.getElementById("photoInput");

const token =
  localStorage.getItem("token");

const API_BASE =
  window.location.origin;

let profileImage = "";

/* =========================
   CEK TOKEN
========================= */

if(!token){

  window.location.href =
    "login.html";
}

/* =========================
   LOAD USER
========================= */

async function loadUser(){

  try{

    const response =
    await fetch(

         `${API_BASE}/api/auth/profile`,

        {

        headers:{

        Authorization:
        `Bearer ${token}`
               }
             }
          );

    const data =
      await response.json();

    console.log(data);

    /* TOKEN EXPIRED */

    if(!response.ok){

      localStorage.removeItem("token");

      localStorage.removeItem("user");

      window.location.href =
        "login.html";

      return;
    }

    const user =
      data.user;

    usernameInput.value =
      user.username || "";

    emailInput.value =
      user.email || "";

    /* FOTO */

    if(user.profileImage){

      profileImage =
        user.profileImage;

      avatarPreview.innerHTML =
      `
      <img
        src="${user.profileImage}"
      >
      `;

    }else{

      avatarPreview.innerHTML =
        user.username
          .charAt(0)
          .toUpperCase();
    }

  }catch(err){

    console.log(err);

    message.innerText =
      "Gagal load profile";
  }
}

loadUser();

/* =========================
   UPLOAD FOTO
========================= */

photoInput.addEventListener(
  "change",
  (e) => {

    const file =
      e.target.files[0];

    if(file){

      const reader =
        new FileReader();

      reader.onload = () => {

        profileImage =
          reader.result;

        avatarPreview.innerHTML =
        `
        <img
          src="${reader.result}"
        >
        `;
      };

      reader.readAsDataURL(file);
    }
  }
);

/* =========================
   SAVE PROFILE
========================= */

saveBtn.addEventListener(
  "click",
  async () => {

    try{

      const response =
        await fetch(

        `${API_BASE}/api/auth/update-profile`,

             {

            method:"PUT",

            headers:{

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body:JSON.stringify({

              username:
                usernameInput.value,

              email:
                emailInput.value,

              profileImage
            })
          }
        );

      const data =
        await response.json();

      console.log(data);

      if(response.ok){

        localStorage.setItem(

          "user",

          JSON.stringify(data.user)
        );

        message.style.color =
          "#00f5c3";

        message.innerText =
          "Profile berhasil diperbarui";

        setTimeout(() => {

          window.location.href =
            "my-account.html";

        },1200);

      }else{

        message.style.color =
          "#ff6b6b";

        message.innerText =
          data.message;
      }

    }catch(err){

      console.log(err);

      message.style.color =
        "#ff6b6b";

      message.innerText =
        "Server error";
    }
  }
);
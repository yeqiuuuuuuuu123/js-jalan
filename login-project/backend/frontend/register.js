const API_BASE =
  window.location.origin;

const REGISTER_API =
  `${API_BASE}/api/auth/register`;

document
  .getElementById("btnRegister")
  .addEventListener("click", register);

async function register(){

  const username = document
    .getElementById("username")
    .value
    .trim();

  const email = document
    .getElementById("email")
    .value
    .trim();

  const password = document
    .getElementById("password")
    .value
    .trim();

  const message = document
    .getElementById("message");

  /* VALIDATION */

  if(!username || !email || !password){

    message.innerText =
      "Semua field wajib diisi";

    return;
  }

  if(password.length < 6){

    message.innerText =
      "Password minimal 6 karakter";

    return;
  }

  try{

       const response = await fetch(
        REGISTER_API,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          username,
          email,
          password
        })
      }
    );

    const data = await response.json();

    if(response.ok){

      message.style.color =
        "#00f5c3";

      message.innerText =
        "Registrasi berhasil...";

      setTimeout(() => {

        window.location.href =
          "login.html";

      },1200);

    }
    else{

      message.style.color =
        "#ff6b6b";

      message.innerText =
        data.message || "Register gagal";
    }

  }
  catch(error){

    console.log(error);

    message.innerText =
      "Server tidak bisa diakses";
  }
}


document.addEventListener(
  "keydown",
  function(e){

    if(e.key === "Enter"){
      register();
    }

  }
);
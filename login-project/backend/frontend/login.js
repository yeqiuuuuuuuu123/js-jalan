document
  .getElementById("loginBtn")
  .addEventListener("click", login);

document
  .getElementById("togglePassword")
  .addEventListener("click", () => {

    const password =
      document.getElementById("password");

    password.type =
      password.type === "password"
        ? "text"
        : "password";

  });

async function login(){

  const email =
    document
      .getElementById("email")
      .value
      .toLowerCase()
      .trim();

  const password =
    document
      .getElementById("password")
      .value;

  const message =
    document.getElementById("message");

  if(!email || !password){

    message.style.color =
      "#ff6b6b";

    message.innerText =
      "Email dan password wajib diisi";

    return;
  }

  try{

    const response =
      await fetch(
        `${window.location.origin}/api/auth/login`,
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({
            email,
            password
          })
        }
      );

    const data =
      await response.json();

    if(response.ok){

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      message.style.color =
        "#00f5c3";

      message.innerText =
        "Login berhasil...";

      setTimeout(() => {

        window.location.href =
          "index.html";

      },1000);

    }else{

      message.style.color =
        "#ff6b6b";

      message.innerText =
        data.message ||
        "Login gagal";
    }

  }catch(error){

    console.error(error);

    message.style.color =
      "#ff6b6b";

    message.innerText =
      "Server tidak bisa diakses";
  }
}

/* =========================
   ENTER KEY
========================= */

document.addEventListener(
  "keydown",
  (e) => {

    if(e.key === "Enter"){

      login();

    }

  }
);

/* =========================
   LOGOUT
========================= */

function logout(){

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "user"
  );

  window.location.replace(
    "login.html"
  );
}
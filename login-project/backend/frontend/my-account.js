document.addEventListener("DOMContentLoaded", () => {

  loadProfile();

});

/* =========================
   LOAD PROFILE
========================= */

function loadProfile(){

  const token =
    localStorage.getItem("token");

  if(!token){

    window.location.href =
      "login.html";

    return;
  }

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  if(!user){

    window.location.href =
      "login.html";

    return;
  }

  /* USERNAME */

  document.getElementById("username")
    .innerText = user.username;

  /* EMAIL */

  document.getElementById("email")
    .innerText = user.email;

  /* ROLE */

  document.getElementById("role")
    .innerText =
      user.role || "User";

  /* POINTS */

/* HAK AKSES */

  document.getElementById("points")
     .innerText =
     user.role === "admin"
      ? "Penuh"
      : "Standar";

  /* AVATAR */

  const avatar =
    document.getElementById("avatar");

  if(user.profileImage){

    avatar.innerHTML =
      `
      <img
        src="${user.profileImage}"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
          border-radius:50%;
        "
      >
      `;

  }else{

    avatar.innerText =
      user.username
        .charAt(0)
        .toUpperCase();
  }
}


function logout(){

  localStorage.removeItem("token");

  localStorage.removeItem("user");

  window.location.href =
    "login.html";
}

const menuBtn =
  document.getElementById("menuBtn");

const sidebar =
  document.querySelector(".sidebar");

const overlay =
  document.getElementById("overlay");

if(menuBtn){

  menuBtn.addEventListener(
    "click",
    () => {

      sidebar.classList.toggle("show");
      overlay.classList.toggle("show");

    }
  );

  overlay.addEventListener(
    "click",
    () => {

      sidebar.classList.remove("show");
      overlay.classList.remove("show");

    }
  );
}
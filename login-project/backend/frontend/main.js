document.addEventListener("DOMContentLoaded", () => {

  const menuBtn =
    document.getElementById("menuBtn");

  const sidebar =
    document.getElementById("sidebar");

  if(menuBtn && sidebar){

    menuBtn.onclick = () => {

      if(window.innerWidth <= 950){

        sidebar.classList.toggle("show");

      }else{

        sidebar.classList.toggle("closed");
        menuBtn.classList.toggle("move");

      }

    };

  }

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

  const userData =
    localStorage.getItem("user");

  if(!userData){

    window.location.href =
      "login.html";

    return;

  }

  const user =
    JSON.parse(userData);

  console.log(
    "USER LOGIN:",
    user
  );

  /* =========================
     ROLE CHECK
  ========================= */

  const menuDeteksi =
    document.getElementById(
      "menuDeteksi"
    );

  const menuAdmin =
    document.getElementById(
      "menuAdmin"
    );

  if(user.role !== "admin"){

    if(menuDeteksi){

      menuDeteksi.style.display =
        "none";

    }

    if(menuAdmin){

      menuAdmin.style.display =
        "none";

    }

  }

  /* =========================
     PROFILE
  ========================= */

  const profileName =
    document.getElementById(
      "profileName"
    );

  const profileInitial =
    document.getElementById(
      "profileInitial"
    );

  if(profileName){

    profileName.innerText =
      user.username || "User";

  }

  if(profileInitial){

    if(user.profileImage){

      profileInitial.innerHTML =

      `
      <img
        src="${user.profileImage}"
        class="profile-img"
      >
      `;

    }else{

      profileInitial.innerText =

        (user.username || "U")
        .charAt(0)
        .toUpperCase();

    }

  }

}

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

  window.location.href =
    "login.html";

}
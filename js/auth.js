const auth = firebase.auth();

function getRedirectPath() {
  const params = new URLSearchParams(window.location.search);
  return params.get("redirect") || "people.html";
}

function getCurrentPath() {
  return window.location.pathname.split("/").pop() + window.location.search;
}

window.FamilyAuth = {
  setupLoginPage() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const googleSignInBtn = document.getElementById("googleSignInBtn");
    const authMessage = document.getElementById("authMessage");

    auth.onAuthStateChanged((user) => {
      if (user && window.location.pathname.includes("login.html")) {
        window.location.href = getRedirectPath();
      }
    });

    if (loginForm) {
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
          await auth.signInWithEmailAndPassword(email, password);
          window.location.href = getRedirectPath();
        } catch (error) {
          authMessage.textContent = error.message;
        }
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;

        try {
          await auth.createUserWithEmailAndPassword(email, password);
          window.location.href = getRedirectPath();
        } catch (error) {
          authMessage.textContent = error.message;
        }
      });
    }

    if (googleSignInBtn) {
      googleSignInBtn.addEventListener("click", async () => {
        const provider = new firebase.auth.GoogleAuthProvider();

        try {
          await auth.signInWithPopup(provider);
          window.location.href = getRedirectPath();
        } catch (error) {
          authMessage.textContent = error.message;
        }
      });
    }
  },

  protectPage() {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        const redirect = encodeURIComponent(getCurrentPath());
        window.location.href = `login.html?redirect=${redirect}`;
        return;
      }

      this.renderLogoutButton(user);
    });
  },

  renderLogoutButton(user) {
    const navLinks = document.querySelector(".nav-links");

    if (!navLinks) return;

    let authBox = document.getElementById("authBox");

    if (!authBox) {
      authBox = document.createElement("button");
      authBox.id = "authBox";
      authBox.className = "auth-box";
      navLinks.appendChild(authBox);
    }

    authBox.textContent = "Logout";
    authBox.title = user.email || "Logged in";

    authBox.onclick = async () => {
      await auth.signOut();
      window.location.href = "login.html";
    };
  },

  async getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
},

async getTokenOrRedirect() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();

      if (!user) {
        const redirect = encodeURIComponent(getCurrentPath());
        window.location.href = `login.html?redirect=${redirect}`;
        return;
      }

      const token = await user.getIdToken();
      this.renderLogoutButton(user);

      resolve(token);
    });
  });
}
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("login.html")) {
    window.FamilyAuth.setupLoginPage();
    return;
  }

  window.FamilyAuth.protectPage();
});
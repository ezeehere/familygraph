const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

async function getFirebaseAuthToken() {
  if (!window.firebase || !firebase.auth) {
    throw new Error("Firebase Auth is not loaded.");
  }

  const auth = firebase.auth();

  const user =
    auth.currentUser ||
    (await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
        unsubscribe();
        resolve(firebaseUser);
      });
    }));

  if (!user) {
    const currentPage =
      window.location.pathname.split("/").pop() + window.location.search;

    window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
    throw new Error("User is not logged in.");
  }

  return await user.getIdToken(true);
}

window.FamilyApi = {
  async request(path, options = {}) {
    const publicPaths = ["/health", "/env-check"];

    let token = null;

    if (!publicPaths.includes(path)) {
      token = await getFirebaseAuthToken();
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }
};
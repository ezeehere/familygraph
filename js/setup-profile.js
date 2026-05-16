const setupProfileForm = document.getElementById("setupProfileForm");
const setupName = document.getElementById("setupName");
const setupGender = document.getElementById("setupGender");
const setupBirthYear = document.getElementById("setupBirthYear");
const setupNote = document.getElementById("setupNote");
const setupMessage = document.getElementById("setupMessage");

function findRootPerson(people) {
  return people.find((person) => {
    return person.isRoot === true || person.authUid;
  });
}

async function initSetupProfilePage() {
  setupMessage.textContent = "Checking your account...";

  const user = await firebase.auth().currentUser ||
    await new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged((firebaseUser) => {
        unsubscribe();
        resolve(firebaseUser);
      });
    });

  if (!user) {
    window.location.href = "login.html?redirect=setup-profile.html";
    return;
  }

  const people = await FamilyUtils.request("/people");
  const rootPerson = findRootPerson(people);

  if (rootPerson) {
    window.location.href = `profile.html?id=${rootPerson.id}`;
    return;
  }

  setupName.value = user.displayName || "";
  setupMessage.textContent = "";
}

setupProfileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  setupMessage.textContent = "Creating your profile...";

  try {
    const user = firebase.auth().currentUser;

    const result = await FamilyUtils.addPerson({
      id: `person-${user.uid}`,
      name: setupName.value.trim(),
      gender: setupGender.value,
      birthYear: setupBirthYear.value.trim(),
      note: setupNote.value.trim() || "Main person",
      isRoot: true,
      authUid: user.uid
    });

    if (!result.success) {
      setupMessage.textContent = result.message;
      return;
    }

    window.location.href = `profile.html?id=${result.person.id}`;
  } catch (error) {
    setupMessage.textContent = error.message;
  }
});

initSetupProfilePage();
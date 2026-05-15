const profileHeader = document.getElementById("profileHeader");
const profileRelationSummary = document.getElementById("profileRelationSummary");
const profileRelations = document.getElementById("profileRelations");

const profileRelationStyle = {
  parent: {
    title: "Parents",
    color: "#8b6f47",
    bg: "#f7f1e2"
  },
  spouse: {
    title: "Spouse",
    color: "#49691f",
    bg: "#f1f7cf"
  },
  sibling: {
    title: "Siblings",
    color: "#9aaa25",
    bg: "#edf5e8"
  },
  child: {
    title: "Children",
    color: "#7cad13",
    bg: "#edf6df"
  },
  grandparent: {
    title: "Grandparents",
    color: "#6f5b3e",
    bg: "#f6efe4"
  },
  grandchild: {
    title: "Grandchildren",
    color: "#5f8f2f",
    bg: "#f0f8e8"
  },
  paternal: {
    title: "Paternal Side",
    color: "#b16b2f",
    bg: "#fff6ed"
  },
  maternal: {
    title: "Maternal Side",
    color: "#6d7fc5",
    bg: "#f4f6ff"
  },
  cousin: {
    title: "Cousins",
    color: "#8d6cc5",
    bg: "#f8f3ff"
  },
  nephewNiece: {
    title: "Nephew / Niece",
    color: "#ba5d75",
    bg: "#fff3f6"
  },
  friend: {
    title: "Friends",
    color: "#4f8f88",
    bg: "#f0faf8"
  },
  manual: {
    title: "Other Relations",
    color: "#607d8b",
    bg: "#f6f9fa"
  }
};

const profileGroupOrder = [
  "parent",
  "spouse",
  "sibling",
  "child",
  "grandparent",
  "grandchild",
  "paternal",
  "maternal",
  "cousin",
  "nephewNiece",
  "friend",
  "manual"
];

function getProfilePerson() {
  const id = FamilyUtils.getPersonIdFromUrl();
  return FamilyUtils.getPersonById(id);
}

function uniqueProfileRelations(list) {
  const map = new Map();

  list.forEach((item) => {
    if (!item || !item.person) return;

    const key = `${item.person.id}-${item.label}-${item.type}`;
    map.set(key, item);
  });

  return Array.from(map.values());
}

function getGenderLabel(person) {
  if (person.gender === "male") return "Male";
  if (person.gender === "female") return "Female";
  return "Unknown";
}

function getLabelByGender(person, maleLabel, femaleLabel, neutralLabel) {
  if (person.gender === "male") return maleLabel;
  if (person.gender === "female") return femaleLabel;
  return neutralLabel;
}

function getGrandparentLabel(person) {
  return getLabelByGender(person, "Grandpa", "Grandma", "Grandparent");
}

function getGrandchildLabel(person) {
  return getLabelByGender(person, "Grandson", "Granddaughter", "Grandchild");
}

function getNephewNieceLabel(person) {
  return getLabelByGender(person, "Nephew", "Niece", "Nephew/Niece");
}

function getSideName(parent) {
  if (parent.gender === "male") return "Paternal";
  if (parent.gender === "female") return "Maternal";
  return "Family";
}

function getUncleAuntLabel(parent, relative) {
  const side = getSideName(parent);

  if (relative.gender === "male") return `${side} Uncle`;
  if (relative.gender === "female") return `${side} Aunt`;

  return `${side} Uncle/Aunt`;
}

function getUncleAuntType(parent) {
  if (parent.gender === "male") return "paternal";
  if (parent.gender === "female") return "maternal";
  return "manual";
}

function getProfileGrandparents(personId) {
  const result = [];

  FamilyUtils.getParents(personId).forEach((parent) => {
    FamilyUtils.getParents(parent.id).forEach((grandparent) => {
      result.push({
        person: grandparent,
        label: getGrandparentLabel(grandparent),
        type: "grandparent"
      });
    });
  });

  return uniqueProfileRelations(result);
}

function getProfileGrandchildren(personId) {
  const result = [];

  FamilyUtils.getChildren(personId).forEach((child) => {
    FamilyUtils.getChildren(child.id).forEach((grandchild) => {
      result.push({
        person: grandchild,
        label: getGrandchildLabel(grandchild),
        type: "grandchild"
      });
    });
  });

  return uniqueProfileRelations(result);
}

function getProfileUnclesAndAunts(personId) {
  const result = [];

  FamilyUtils.getParents(personId).forEach((parent) => {
    FamilyUtils.getSiblings(parent.id).forEach((relative) => {
      result.push({
        person: relative,
        label: getUncleAuntLabel(parent, relative),
        type: getUncleAuntType(parent)
      });
    });
  });

  return uniqueProfileRelations(result);
}

function getProfileCousins(personId) {
  const result = [];

  getProfileUnclesAndAunts(personId).forEach((uncleOrAunt) => {
    FamilyUtils.getChildren(uncleOrAunt.person.id).forEach((cousin) => {
      result.push({
        person: cousin,
        label: "Cousin",
        type: "cousin"
      });
    });
  });

  return uniqueProfileRelations(result);
}

function getProfileNephewsAndNieces(personId) {
  const result = [];

  FamilyUtils.getSiblings(personId).forEach((sibling) => {
    FamilyUtils.getChildren(sibling.id).forEach((child) => {
      result.push({
        person: child,
        label: getNephewNieceLabel(child),
        type: "nephewNiece"
      });
    });
  });

  return uniqueProfileRelations(result);
}

function getManualProfileRelations(personId) {
  const result = [];

  FamilyUtils.getAllRelationships().forEach((relation) => {
    const fromPerson = FamilyUtils.getPersonById(relation.from);
    const toPerson = FamilyUtils.getPersonById(relation.to);

    if (!fromPerson || !toPerson) return;

    const focusIsFrom = relation.from === personId;
    const focusIsTo = relation.to === personId;

    if (!focusIsFrom && !focusIsTo) return;

    function addRelation(person, label, type) {
      result.push({
        person,
        label,
        type
      });
    }

    switch (relation.type) {
      case "FRIEND_OF":
        addRelation(focusIsFrom ? toPerson : fromPerson, "Friend", "friend");
        break;

      case "SIBLING_OF":
      case "BROTHER_OF":
      case "SISTER_OF": {
        const related = focusIsFrom ? toPerson : fromPerson;
        addRelation(
          related,
          getLabelByGender(related, "Brother", "Sister", "Sibling"),
          "sibling"
        );
        break;
      }

      case "COUSIN_OF":
        addRelation(focusIsFrom ? toPerson : fromPerson, "Cousin", "cousin");
        break;

      case "GRANDFATHER_OF":
        if (focusIsTo) {
          addRelation(fromPerson, "Grandpa", "grandparent");
        } else {
          addRelation(
            toPerson,
            getLabelByGender(toPerson, "Grandson", "Granddaughter", "Grandchild"),
            "grandchild"
          );
        }
        break;

      case "GRANDMOTHER_OF":
        if (focusIsTo) {
          addRelation(fromPerson, "Grandma", "grandparent");
        } else {
          addRelation(
            toPerson,
            getLabelByGender(toPerson, "Grandson", "Granddaughter", "Grandchild"),
            "grandchild"
          );
        }
        break;

      case "PATERNAL_UNCLE_OF":
        if (focusIsTo) {
          addRelation(fromPerson, "Paternal Uncle", "paternal");
        } else {
          addRelation(
            toPerson,
            getLabelByGender(toPerson, "Nephew", "Niece", "Nephew/Niece"),
            "nephewNiece"
          );
        }
        break;

      case "PATERNAL_AUNT_OF":
        if (focusIsTo) {
          addRelation(fromPerson, "Paternal Aunt", "paternal");
        } else {
          addRelation(
            toPerson,
            getLabelByGender(toPerson, "Nephew", "Niece", "Nephew/Niece"),
            "nephewNiece"
          );
        }
        break;

      case "MATERNAL_UNCLE_OF":
        if (focusIsTo) {
          addRelation(fromPerson, "Maternal Uncle", "maternal");
        } else {
          addRelation(
            toPerson,
            getLabelByGender(toPerson, "Nephew", "Niece", "Nephew/Niece"),
            "nephewNiece"
          );
        }
        break;

      case "MATERNAL_AUNT_OF":
        if (focusIsTo) {
          addRelation(fromPerson, "Maternal Aunt", "maternal");
        } else {
          addRelation(
            toPerson,
            getLabelByGender(toPerson, "Nephew", "Niece", "Nephew/Niece"),
            "nephewNiece"
          );
        }
        break;

      case "NEPHEW_OF":
        if (focusIsTo) {
          addRelation(fromPerson, "Nephew", "nephewNiece");
        } else {
          addRelation(toPerson, "Uncle/Aunt", "manual");
        }
        break;

      case "NIECE_OF":
        if (focusIsTo) {
          addRelation(fromPerson, "Niece", "nephewNiece");
        } else {
          addRelation(toPerson, "Uncle/Aunt", "manual");
        }
        break;
    }
  });

  return uniqueProfileRelations(result);
}

function getAllProfileRelations(person) {
  const relations = [];

  FamilyUtils.getParents(person.id).forEach((parent) => {
    relations.push({
      person: parent,
      label: FamilyUtils.getRelationLabel(parent, "parent"),
      type: "parent"
    });
  });

  FamilyUtils.getSpouses(person.id).forEach((spouse) => {
    relations.push({
      person: spouse,
      label: "Spouse",
      type: "spouse"
    });
  });

  FamilyUtils.getSiblings(person.id).forEach((sibling) => {
    relations.push({
      person: sibling,
      label: FamilyUtils.getRelationLabel(sibling, "sibling"),
      type: "sibling"
    });
  });

  FamilyUtils.getChildren(person.id).forEach((child) => {
    relations.push({
      person: child,
      label: FamilyUtils.getRelationLabel(child, "child"),
      type: "child"
    });
  });

  relations.push(...getProfileGrandparents(person.id));
  relations.push(...getProfileGrandchildren(person.id));
  relations.push(...getProfileUnclesAndAunts(person.id));
  relations.push(...getProfileCousins(person.id));
  relations.push(...getProfileNephewsAndNieces(person.id));
  relations.push(...getManualProfileRelations(person.id));

  return uniqueProfileRelations(relations);
}

function groupProfileRelations(relations) {
  const groups = {};

  profileGroupOrder.forEach((key) => {
    groups[key] = [];
  });

  relations.forEach((relation) => {
    if (!groups[relation.type]) {
      groups[relation.type] = [];
    }

    groups[relation.type].push(relation);
  });

  return groups;
}

function renderProfileHeader(person, relations) {
  profileHeader.innerHTML = `
    <div class="profile-avatar">
      ${FamilyUtils.getInitials(person.name)}
    </div>

    <div class="profile-main-info">
      <h1>${person.name}</h1>

      <div class="profile-meta">
        <span>${getGenderLabel(person)}</span>
        <span>${person.note || "No note added"}</span>
        <span>${relations.length} relation${relations.length === 1 ? "" : "s"}</span>
      </div>
    </div>

    <div class="profile-actions">
      <a href="tree.html?id=${person.id}">Open Tree</a>
      <a href="people.html">Back to People</a>
    </div>
  `;
}

function renderProfileSummary(groups) {
  profileRelationSummary.innerHTML = "";

  profileGroupOrder.forEach((key) => {
    const items = groups[key] || [];

    if (items.length === 0) return;

    const style = profileRelationStyle[key];

    const card = document.createElement("div");
    card.className = "profile-summary-card";

    card.innerHTML = `
      <span style="background:${style.color};"></span>
      <strong>${items.length}</strong>
      <p>${style.title}</p>
    `;

    profileRelationSummary.appendChild(card);
  });
}

function createProfileRelationCard(relation) {
  const style = profileRelationStyle[relation.type] || profileRelationStyle.manual;

  const card = document.createElement("button");
  card.type = "button";
  card.className = "profile-relation-card";
  card.style.background = style.bg;
  card.style.borderColor = style.color;
  card.style.color = "#1f2418";

  card.innerHTML = `
    <span style="border-color:${style.color}; color:${style.color};">
      ${relation.label}
    </span>
    <strong>${relation.person.name}</strong>
  `;

  card.addEventListener("click", () => {
    window.location.href = `profile.html?id=${relation.person.id}`;
  });

  return card;
}

function renderProfileRelations(groups) {
  profileRelations.innerHTML = "";

  let hasAnyRelation = false;

  profileGroupOrder.forEach((key) => {
    const items = groups[key] || [];

    if (items.length === 0) return;

    hasAnyRelation = true;

    const style = profileRelationStyle[key];

    const section = document.createElement("section");
    section.className = "profile-relation-section";

    section.innerHTML = `
      <div class="profile-section-heading">
        <span style="background:${style.color};"></span>
        <h3>${style.title}</h3>
      </div>

      <div class="profile-section-grid"></div>
    `;

    const grid = section.querySelector(".profile-section-grid");

    items.forEach((relation) => {
      grid.appendChild(createProfileRelationCard(relation));
    });

    profileRelations.appendChild(section);
  });

  if (!hasAnyRelation) {
    profileRelations.innerHTML = `
      <div class="empty-family-state">
        No relations found for this person yet.
      </div>
    `;
  }
}
function renderProfilePage() {
  const person = getProfilePerson();

  if (!person) {
    profileHeader.innerHTML = `
      <div class="empty-family-state">
        Person not found. Please go back to People page and open the profile again.
      </div>
    `;

    profileRelationSummary.innerHTML = "";
    profileRelations.innerHTML = "";
    return;
  }

  const relations = getAllProfileRelations(person);
  const groups = groupProfileRelations(relations);

  renderProfileHeader(person, relations);
  renderProfileSummary(groups);
  renderProfileRelations(groups);
}

async function initProfilePage() {
  profileHeader.innerHTML = `
    <div class="empty-family-state">
      Loading profile from backend...
    </div>
  `;

  await FamilyUtils.loadData();

  renderProfilePage();
}

initProfilePage();
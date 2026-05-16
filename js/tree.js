const focusNode = document.getElementById("focusNode");
const relationNodes = document.getElementById("relationNodes");
const treeLines = document.getElementById("treeLines");

const relationStyle = {
  parent: {
    line: "#8b6f47",
    chipBg: "#f5ead8",
    chipText: "#5f4627",
    nodeBg: "#f7f1e2",
    nodeBorder: "#b28d60",
    nodeText: "#5b4124",
    legendTitle: "Parent",
    legendDesc: "Father or mother"
  },
  spouse: {
    line: "#49691f",
    chipBg: "#eef4b2",
    chipText: "#334b16",
    nodeBg: "#f1f7cf",
    nodeBorder: "#87a63a",
    nodeText: "#334b16",
    legendTitle: "Spouse",
    legendDesc: "Husband or wife"
  },
  sibling: {
    line: "#9aaa25",
    chipBg: "#f3f7dc",
    chipText: "#5d6615",
    nodeBg: "#edf5e8",
    nodeBorder: "#a4b63f",
    nodeText: "#516019",
    legendTitle: "Sibling",
    legendDesc: "Brother or sister"
  },
  child: {
    line: "#7cad13",
    chipBg: "#e7f2d2",
    chipText: "#49691f",
    nodeBg: "#edf6df",
    nodeBorder: "#90b93a",
    nodeText: "#49691f",
    legendTitle: "Child",
    legendDesc: "Son or daughter"
  },
  grandparent: {
    line: "#6f5b3e",
    chipBg: "#efe4d3",
    chipText: "#59452b",
    nodeBg: "#f6efe4",
    nodeBorder: "#9a7c55",
    nodeText: "#59452b",
    legendTitle: "Grandparent",
    legendDesc: "Parent's parent"
  },
  grandchild: {
    line: "#5f8f2f",
    chipBg: "#eaf4df",
    chipText: "#3f6420",
    nodeBg: "#f0f8e8",
    nodeBorder: "#7daa48",
    nodeText: "#3f6420",
    legendTitle: "Grandchild",
    legendDesc: "Child's child"
  },
  paternal: {
    line: "#b16b2f",
    chipBg: "#fff0df",
    chipText: "#7a4318",
    nodeBg: "#fff6ed",
    nodeBorder: "#c78648",
    nodeText: "#7a4318",
    legendTitle: "Paternal side",
    legendDesc: "Father's family"
  },
  maternal: {
    line: "#6d7fc5",
    chipBg: "#edf0ff",
    chipText: "#39498a",
    nodeBg: "#f4f6ff",
    nodeBorder: "#7d8dd1",
    nodeText: "#39498a",
    legendTitle: "Maternal side",
    legendDesc: "Mother's family"
  },
  cousin: {
    line: "#8d6cc5",
    chipBg: "#f3ecff",
    chipText: "#543987",
    nodeBg: "#f8f3ff",
    nodeBorder: "#9b7ed1",
    nodeText: "#543987",
    legendTitle: "Cousin",
    legendDesc: "Uncle or aunt's child"
  },
  nephewNiece: {
    line: "#ba5d75",
    chipBg: "#fdeaf0",
    chipText: "#7c3145",
    nodeBg: "#fff3f6",
    nodeBorder: "#c9798d",
    nodeText: "#7c3145",
    legendTitle: "Nephew/Niece",
    legendDesc: "Sibling's child"
  }
  ,
friend: {
  line: "#4f8f88",
  chipBg: "#e6f4f1",
  chipText: "#275b55",
  nodeBg: "#f0faf8",
  nodeBorder: "#6faea7",
  nodeText: "#275b55",
  legendTitle: "Friend",
  legendDesc: "Non-family connection"
},
manual: {
  line: "#607d8b",
  chipBg: "#eef3f5",
  chipText: "#33464f",
  nodeBg: "#f6f9fa",
  nodeBorder: "#8aa1ab",
  nodeText: "#33464f",
  legendTitle: "Manual relation",
  legendDesc: "Added directly"
}
};

const groupConfig = [
  {
    key: "grandparent",
    title: "Grandparents"
  },
  {
    key: "parent",
    title: "Parents"
  },
  {
    key: "spouse",
    title: "Spouse"
  },
  {
    key: "sibling",
    title: "Siblings"
  },
  {
    key: "child",
    title: "Children"
  },
  {
    key: "grandchild",
    title: "Grandchildren"
  },
  {
    key: "paternal",
    title: "Paternal side"
  },
  {
    key: "maternal",
    title: "Maternal side"
  },
  {
    key: "cousin",
    title: "Cousins"
  },
  {
    key: "nephewNiece",
    title: "Nephew / Niece"
  },
  {
    key: "friend",
    title: "Friends"
    },
    {
    key: "manual",
    title: "Other added relations"
    }
];

function getFocusPerson() {
  const id = FamilyUtils.getPersonIdFromUrl();
  return FamilyUtils.getPersonById(id);
}

function uniquePeople(list) {
  const map = new Map();

  list.forEach((item) => {
    if (!item || !item.person) return;
    const key = `${item.person.id}-${item.displayLabel}-${item.type}`;
    map.set(key, item);
  });

  return Array.from(map.values());
}

function getGrandparentLabel(person) {
  if (person.gender === "male") return "Grandpa";
  if (person.gender === "female") return "Grandma";
  return "Grandparent";
}

function getGrandchildLabel(person) {
  if (person.gender === "male") return "Grandson";
  if (person.gender === "female") return "Granddaughter";
  return "Grandchild";
}

function getNephewNieceLabel(person) {
  if (person.gender === "male") return "Nephew";
  if (person.gender === "female") return "Niece";
  return "Nephew/Niece";
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
  return "paternal";
}

function getGrandparents(personId) {
  const grandparents = [];

  FamilyUtils.getParents(personId).forEach((parent) => {
    FamilyUtils.getParents(parent.id).forEach((grandparent) => {
      grandparents.push({
        person: grandparent,
        displayLabel: getGrandparentLabel(grandparent),
        type: "grandparent"
      });
    });
  });

  return uniquePeople(grandparents);
}

function getGrandchildren(personId) {
  const grandchildren = [];

  FamilyUtils.getChildren(personId).forEach((child) => {
    FamilyUtils.getChildren(child.id).forEach((grandchild) => {
      grandchildren.push({
        person: grandchild,
        displayLabel: getGrandchildLabel(grandchild),
        type: "grandchild"
      });
    });
  });

  return uniquePeople(grandchildren);
}

function getUnclesAndAunts(personId) {
  const relatives = [];

  FamilyUtils.getParents(personId).forEach((parent) => {
    FamilyUtils.getSiblings(parent.id).forEach((relative) => {
      relatives.push({
        person: relative,
        displayLabel: getUncleAuntLabel(parent, relative),
        type: getUncleAuntType(parent)
      });
    });
  });

  return uniquePeople(relatives);
}

function getCousins(personId) {
  const cousins = [];

  getUnclesAndAunts(personId).forEach((uncleOrAunt) => {
    FamilyUtils.getChildren(uncleOrAunt.person.id).forEach((cousin) => {
      cousins.push({
        person: cousin,
        displayLabel: "Cousin",
        type: "cousin"
      });
    });
  });

  return uniquePeople(cousins);
}

function getNephewsAndNieces(personId) {
  const nephewsAndNieces = [];

  FamilyUtils.getSiblings(personId).forEach((sibling) => {
    FamilyUtils.getChildren(sibling.id).forEach((child) => {
      nephewsAndNieces.push({
        person: child,
        displayLabel: getNephewNieceLabel(child),
        type: "nephewNiece"
      });
    });
  });

  return uniquePeople(nephewsAndNieces);
}

function createPersonNode(person, displayLabel, relationType) {
  const style = relationStyle[relationType];

  const card = document.createElement("button");
  card.className = "relation-table-card";
  card.type = "button";

  card.innerHTML = `
    <span class="relation-table-chip">${displayLabel}</span>
    <strong>${person.name}</strong>
  `;

  if (style) {
    card.style.background = style.nodeBg;
    card.style.borderColor = style.nodeBorder;
    card.style.color = style.nodeText;

    const chip = card.querySelector(".relation-table-chip");
    chip.style.background = style.chipBg;
    chip.style.borderColor = style.line;
    chip.style.color = style.chipText;
  }

  card.addEventListener("click", () => {
    FamilyUtils.openTree(person.id);
  });

  return card;
}

function getManualRelationLabel(type) {
  const labels = {
    FRIEND_OF: "Friend",

    SIBLING_OF: "Sibling",
    BROTHER_OF: "Brother",
    SISTER_OF: "Sister",

    GRANDFATHER_OF: "Grandpa",
    GRANDMOTHER_OF: "Grandma",

    PATERNAL_UNCLE_OF: "Paternal Uncle",
    PATERNAL_AUNT_OF: "Paternal Aunt",
    MATERNAL_UNCLE_OF: "Maternal Uncle",
    MATERNAL_AUNT_OF: "Maternal Aunt",

    COUSIN_OF: "Cousin",
    NEPHEW_OF: "Nephew",
    NIECE_OF: "Niece"
  };

  return labels[type] || "Relation";
}

function getManualRelationGroup(type) {
  const groupMap = {
    FRIEND_OF: "friend",

    SIBLING_OF: "sibling",
    BROTHER_OF: "sibling",
    SISTER_OF: "sibling",

    GRANDFATHER_OF: "grandparent",
    GRANDMOTHER_OF: "grandparent",

    PATERNAL_UNCLE_OF: "paternal",
    PATERNAL_AUNT_OF: "paternal",
    MATERNAL_UNCLE_OF: "maternal",
    MATERNAL_AUNT_OF: "maternal",

    COUSIN_OF: "cousin",
    NEPHEW_OF: "nephewNiece",
    NIECE_OF: "nephewNiece"
  };

  return groupMap[type] || "manual";
}

function getLabelByGender(person, maleLabel, femaleLabel, neutralLabel) {
  if (person.gender === "male") return maleLabel;
  if (person.gender === "female") return femaleLabel;
  return neutralLabel;
}

function getManualRelations(personId) {
  const results = [];

  FamilyUtils.getAllRelationships().forEach((relation) => {
    const fromPerson = FamilyUtils.getPersonById(relation.from);
    const toPerson = FamilyUtils.getPersonById(relation.to);

    if (!fromPerson || !toPerson) return;

    const focusIsFrom = relation.from === personId;
    const focusIsTo = relation.to === personId;

    if (!focusIsFrom && !focusIsTo) return;

    function addRelated(person, displayLabel, type) {
      results.push({
        person,
        displayLabel,
        type
      });
    }

    switch (relation.type) {
      case "FRIEND_OF":
        addRelated(focusIsFrom ? toPerson : fromPerson, "Friend", "friend");
        break;

      case "SIBLING_OF":
        addRelated(
          focusIsFrom ? toPerson : fromPerson,
          getLabelByGender(focusIsFrom ? toPerson : fromPerson, "Brother", "Sister", "Sibling"),
          "sibling"
        );
        break;

      case "BROTHER_OF":
      case "SISTER_OF": {
        const related = focusIsFrom ? toPerson : fromPerson;

        addRelated(
          related,
          getLabelByGender(related, "Brother", "Sister", "Sibling"),
          "sibling"
        );
        break;
      }

      case "COUSIN_OF":
        addRelated(focusIsFrom ? toPerson : fromPerson, "Cousin", "cousin");
        break;

      case "GRANDFATHER_OF":
        if (focusIsTo) {
          addRelated(fromPerson, "Grandpa", "grandparent");
        } else {
          addRelated(
            toPerson,
            getLabelByGender(toPerson, "Grandson", "Granddaughter", "Grandchild"),
            "grandchild"
          );
        }
        break;

      case "GRANDMOTHER_OF":
        if (focusIsTo) {
          addRelated(fromPerson, "Grandma", "grandparent");
        } else {
          addRelated(
            toPerson,
            getLabelByGender(toPerson, "Grandson", "Granddaughter", "Grandchild"),
            "grandchild"
          );
        }
        break;

      case "PATERNAL_UNCLE_OF":
        if (focusIsTo) {
          addRelated(fromPerson, "Paternal Uncle", "paternal");
        } else {
          addRelated(
            toPerson,
            getLabelByGender(toPerson, "Nephew", "Niece", "Nephew/Niece"),
            "nephewNiece"
          );
        }
        break;

      case "PATERNAL_AUNT_OF":
        if (focusIsTo) {
          addRelated(fromPerson, "Paternal Aunt", "paternal");
        } else {
          addRelated(
            toPerson,
            getLabelByGender(toPerson, "Nephew", "Niece", "Nephew/Niece"),
            "nephewNiece"
          );
        }
        break;

      case "MATERNAL_UNCLE_OF":
        if (focusIsTo) {
          addRelated(fromPerson, "Maternal Uncle", "maternal");
        } else {
          addRelated(
            toPerson,
            getLabelByGender(toPerson, "Nephew", "Niece", "Nephew/Niece"),
            "nephewNiece"
          );
        }
        break;

      case "MATERNAL_AUNT_OF":
        if (focusIsTo) {
          addRelated(fromPerson, "Maternal Aunt", "maternal");
        } else {
          addRelated(
            toPerson,
            getLabelByGender(toPerson, "Nephew", "Niece", "Nephew/Niece"),
            "nephewNiece"
          );
        }
        break;

      case "NEPHEW_OF":
        if (focusIsTo) {
          addRelated(fromPerson, "Nephew", "nephewNiece");
        } else {
          addRelated(
            toPerson,
            getLabelByGender(toPerson, "Uncle", "Aunt", "Uncle/Aunt"),
            "manual"
          );
        }
        break;

      case "NIECE_OF":
        if (focusIsTo) {
          addRelated(fromPerson, "Niece", "nephewNiece");
        } else {
          addRelated(
            toPerson,
            getLabelByGender(toPerson, "Uncle", "Aunt", "Uncle/Aunt"),
            "manual"
          );
        }
        break;
    }
  });

  return uniquePeople(results);
}

function getRelationList(person) {
  const relations = [];

  FamilyUtils.getParents(person.id).forEach((parent) => {
    relations.push({
      person: parent,
      displayLabel: FamilyUtils.getRelationLabel(parent, "parent"),
      type: "parent"
    });
  });

  FamilyUtils.getSpouses(person.id).forEach((spouse) => {
    relations.push({
      person: spouse,
      displayLabel: "Spouse",
      type: "spouse"
    });
  });

  FamilyUtils.getSiblings(person.id).forEach((sibling) => {
    relations.push({
      person: sibling,
      displayLabel: FamilyUtils.getRelationLabel(sibling, "sibling"),
      type: "sibling"
    });
  });

  FamilyUtils.getChildren(person.id).forEach((child) => {
    relations.push({
      person: child,
      displayLabel: FamilyUtils.getRelationLabel(child, "child"),
      type: "child"
    });
  });

  relations.push(...getGrandparents(person.id));
  relations.push(...getGrandchildren(person.id));
  relations.push(...getUnclesAndAunts(person.id));
  relations.push(...getCousins(person.id));
  relations.push(...getNephewsAndNieces(person.id));
  relations.push(...getManualRelations(person.id));

return uniquePeople(relations);

}

function groupRelations(relations) {
  const groups = {};

  groupConfig.forEach((group) => {
    groups[group.key] = [];
  });

  relations.forEach((relation) => {
    if (!groups[relation.type]) {
      groups[relation.type] = [];
    }

    groups[relation.type].push(relation);
  });

  return groups;
}

function renderTree() {
  const focusPerson = getFocusPerson();

  if (!focusPerson) {
    focusNode.textContent = "Person not found";
    relationNodes.innerHTML = `
      <div class="empty-family-state">
        This person does not exist in backend data.
      </div>
    `;

    if (treeLines) {
      treeLines.innerHTML = "";
    }

    return;
  }

  const relations = getRelationList(focusPerson);
  const groups = groupRelations(relations);

  focusNode.textContent = focusPerson.name;

  relationNodes.innerHTML = "";
  relationNodes.className = "relation-table-layout";

  if (treeLines) {
    treeLines.innerHTML = "";
  }

  groupConfig.forEach((group) => {
    const list = groups[group.key];

    if (!list || list.length === 0) return;

    const section = document.createElement("section");
    section.className = "relation-table-section";

    const style = relationStyle[group.key];

    section.innerHTML = `
      <div class="relation-table-heading">
        <span class="relation-heading-line"></span>
        <h3>${group.title}</h3>
      </div>
      <div class="relation-table-grid"></div>
    `;

    const line = section.querySelector(".relation-heading-line");

    if (style) {
      line.style.background = style.line;
    }

    const grid = section.querySelector(".relation-table-grid");

    list.forEach((relation) => {
      grid.appendChild(
        createPersonNode(relation.person, relation.displayLabel, relation.type)
      );
    });

    relationNodes.appendChild(section);
  });

  if (relationNodes.children.length === 0) {
    relationNodes.innerHTML = `
      <div class="empty-family-state">
        No relation data found for this person yet.
      </div>
    `;
  }

 
}



async function initTreePage() {
  await FamilyUtils.loadData();

  const person = getFocusPerson();

  if (!person) {
    focusNode.textContent = "Person not found";
    relationNodes.innerHTML = `
      <div class="empty-family-state">
        This person does not exist in backend data.
      </div>
    `;

    if (treeLines) {
      treeLines.innerHTML = "";
    }

    return;
  }

  renderTree();
}

initTreePage();



  legendBox.innerHTML = `
    <h3>Relation guide</h3>
    <div class="relation-legend-list">
      ${Object.keys(relationStyle)
        .map((key) => {
          const item = relationStyle[key];

          return `
            <div class="relation-legend-item">
              <span class="legend-line" style="background:${item.line};"></span>
              <div class="legend-text">
                <strong>${item.legendTitle}</strong>
                <p>${item.legendDesc}</p>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;


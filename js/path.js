const startPerson = document.getElementById("startPerson");
const endPerson = document.getElementById("endPerson");
const findPathBtn = document.getElementById("findPathBtn");
const swapPeopleBtn = document.getElementById("swapPeopleBtn");
const pathResult = document.getElementById("pathResult");

function getGenderBasedLabel(person, maleLabel, femaleLabel, neutralLabel) {
  if (!person) return neutralLabel;
  if (person.gender === "male") return maleLabel;
  if (person.gender === "female") return femaleLabel;
  return neutralLabel;
}

function getPossessiveName(name) {
  if (name.endsWith("s")) {
    return `${name}'`;
  }

  return `${name}'s`;
}

function getRoleByGender(person, maleLabel, femaleLabel, neutralLabel) {
  if (!person) return neutralLabel;
  if (person.gender === "male") return maleLabel;
  if (person.gender === "female") return femaleLabel;
  return neutralLabel;
}

function getParentRole(person) {
  return getRoleByGender(person, "father", "mother", "parent");
}

function getChildRole(person) {
  return getRoleByGender(person, "son", "daughter", "child");
}

function getSiblingRole(person) {
  return getRoleByGender(person, "brother", "sister", "sibling");
}

function getGrandparentRole(person) {
  return getRoleByGender(person, "grandfather", "grandmother", "grandparent");
}

function getGrandchildRole(person) {
  return getRoleByGender(person, "grandson", "granddaughter", "grandchild");
}

function getUncleAuntRole(person) {
  return getRoleByGender(person, "uncle", "aunt", "uncle/aunt");
}

function getNephewNieceRole(person) {
  return getRoleByGender(person, "nephew", "niece", "nephew/niece");
}

function getLabelKind(label) {
  const childLabels = ["Son", "Daughter", "Child"];
  const parentLabels = ["Father", "Mother", "Parent"];
  const siblingLabels = ["Brother", "Sister", "Sibling"];
  const grandchildLabels = ["Grandson", "Granddaughter", "Grandchild"];
  const grandparentLabels = ["Grandpa", "Grandma", "Grandparent"];
  const nephewNieceLabels = ["Nephew", "Niece", "Nephew/Niece"];
  const uncleAuntLabels = [
    "Uncle",
    "Aunt",
    "Uncle/Aunt",
    "Paternal Uncle",
    "Paternal Aunt",
    "Maternal Uncle",
    "Maternal Aunt"
  ];

  if (childLabels.includes(label)) return "down";
  if (parentLabels.includes(label)) return "up";
  if (siblingLabels.includes(label)) return "sibling";
  if (grandchildLabels.includes(label)) return "grandchild";
  if (grandparentLabels.includes(label)) return "grandparent";
  if (nephewNieceLabels.includes(label)) return "nephewNiece";
  if (uncleAuntLabels.includes(label)) return "uncleAunt";
  if (label === "Spouse") return "spouse";
  if (label === "Friend") return "friend";
  if (label === "Cousin") return "cousin";

  return "unknown";
}

function addGreatPrefix(baseRelation, stepCount) {
  if (stepCount === 2) {
    return baseRelation;
  }

  const greatCount = stepCount - 2;
  const prefix = Array(greatCount).fill("great").join("-");

  return `${prefix}-${baseRelation}`;
}

function makeRelationSentence(start, end, relationText) {
  return `${start.name} is ${getPossessiveName(end.name)} ${relationText}.`;
}

function getDirectRelationMeaning(start, end, step) {
  const kind = getLabelKind(step.label);

  if (kind === "down") {
    return getParentRole(start);
  }

  if (kind === "up") {
    return getChildRole(start);
  }

  if (kind === "sibling") {
    return getSiblingRole(start);
  }

  if (kind === "spouse") {
    return "spouse";
  }

  if (kind === "friend") {
    return "friend";
  }

  if (kind === "cousin") {
    return "cousin";
  }

  if (kind === "grandchild") {
    return getGrandparentRole(start);
  }

  if (kind === "grandparent") {
    return getGrandchildRole(start);
  }

  if (kind === "nephewNiece") {
    return getUncleAuntRole(start);
  }

  if (kind === "uncleAunt") {
    return getNephewNieceRole(start);
  }

  return null;
}

function getSmartRelationSentence(start, end, steps) {
  if (!steps || steps.length === 0) {
    return `${start.name} and ${end.name} are the same person.`;
  }

  if (steps.length === 1) {
    const relation = getDirectRelationMeaning(start, end, steps[0]);

    if (relation) {
      return makeRelationSentence(start, end, relation);
    }
  }

  const kinds = steps.map((step) => getLabelKind(step.label));

  const allDown = kinds.every((kind) => kind === "down");
  const allUp = kinds.every((kind) => kind === "up");

  if (allDown && steps.length >= 2) {
    const relation = addGreatPrefix(getGrandparentRole(start), steps.length);
    return makeRelationSentence(start, end, relation);
  }

  if (allUp && steps.length >= 2) {
    const relation = addGreatPrefix(getGrandchildRole(start), steps.length);
    return makeRelationSentence(start, end, relation);
  }

  if (
    steps.length === 2 &&
    kinds[0] === "sibling" &&
    kinds[1] === "down"
  ) {
    return makeRelationSentence(start, end, getUncleAuntRole(start));
  }

  if (
    steps.length === 2 &&
    kinds[0] === "up" &&
    kinds[1] === "sibling"
  ) {
    return makeRelationSentence(start, end, getNephewNieceRole(start));
  }

  if (
    steps.length === 3 &&
    kinds[0] === "up" &&
    kinds[1] === "sibling" &&
    kinds[2] === "down"
  ) {
    return makeRelationSentence(start, end, "cousin");
  }

  return `${start.name} is connected to ${end.name} through ${steps.length} relationship steps.`;
}

function getRelationLabelForPath(relation, currentId, nextId) {
  const currentIsFrom = relation.from === currentId;
  const nextPerson = FamilyUtils.getPersonById(nextId);

  switch (relation.type) {
    case "PARENT_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Son", "Daughter", "Child");
      }

      return getGenderBasedLabel(nextPerson, "Father", "Mother", "Parent");

    case "MARRIED_TO":
      return "Spouse";

    case "FRIEND_OF":
      return "Friend";

    case "SIBLING_OF":
    case "BROTHER_OF":
    case "SISTER_OF":
      return getGenderBasedLabel(nextPerson, "Brother", "Sister", "Sibling");

    case "COUSIN_OF":
      return "Cousin";

    case "GRANDFATHER_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Grandson", "Granddaughter", "Grandchild");
      }

      return "Grandpa";

    case "GRANDMOTHER_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Grandson", "Granddaughter", "Grandchild");
      }

      return "Grandma";

    case "PATERNAL_UNCLE_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Nephew", "Niece", "Nephew/Niece");
      }

      return "Paternal Uncle";

    case "PATERNAL_AUNT_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Nephew", "Niece", "Nephew/Niece");
      }

      return "Paternal Aunt";

    case "MATERNAL_UNCLE_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Nephew", "Niece", "Nephew/Niece");
      }

      return "Maternal Uncle";

    case "MATERNAL_AUNT_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Nephew", "Niece", "Nephew/Niece");
      }

      return "Maternal Aunt";

    case "NEPHEW_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Uncle", "Aunt", "Uncle/Aunt");
      }

      return "Nephew";

    case "NIECE_OF":
      if (currentIsFrom) {
        return getGenderBasedLabel(nextPerson, "Uncle", "Aunt", "Uncle/Aunt");
      }

      return "Niece";

    default:
      return "Related";
  }
}

function buildGraph() {
  const graph = new Map();
  const people = FamilyUtils.getAllPeople();
  const relationships = FamilyUtils.getAllRelationships();

  people.forEach((person) => {
    graph.set(person.id, []);
  });

  relationships.forEach((relation) => {
    const fromPerson = FamilyUtils.getPersonById(relation.from);
    const toPerson = FamilyUtils.getPersonById(relation.to);

    if (!fromPerson || !toPerson) return;

    if (!graph.has(relation.from)) {
      graph.set(relation.from, []);
    }

    if (!graph.has(relation.to)) {
      graph.set(relation.to, []);
    }

    graph.get(relation.from).push({
      to: relation.to,
      label: getRelationLabelForPath(relation, relation.from, relation.to),
      type: relation.type
    });

    graph.get(relation.to).push({
      to: relation.from,
      label: getRelationLabelForPath(relation, relation.to, relation.from),
      type: relation.type
    });
  });

  return graph;
}

function findShortestPath(startId, endId) {
  if (startId === endId) {
    return {
      found: true,
      steps: []
    };
  }

  const graph = buildGraph();
  const queue = [startId];
  const visited = new Set([startId]);
  const previous = new Map();

  while (queue.length > 0) {
    const currentId = queue.shift();
    const edges = graph.get(currentId) || [];

    for (const edge of edges) {
      if (visited.has(edge.to)) continue;

      visited.add(edge.to);

      previous.set(edge.to, {
        from: currentId,
        label: edge.label,
        type: edge.type
      });

      if (edge.to === endId) {
        return buildPath(previous, startId, endId);
      }

      queue.push(edge.to);
    }
  }

  return {
    found: false,
    steps: []
  };
}

function buildPath(previous, startId, endId) {
  const steps = [];
  let currentId = endId;

  while (currentId !== startId) {
    const prev = previous.get(currentId);

    if (!prev) {
      return {
        found: false,
        steps: []
      };
    }

    steps.unshift({
      from: prev.from,
      to: currentId,
      label: prev.label,
      type: prev.type
    });

    currentId = prev.from;
  }

  return {
    found: true,
    steps
  };
}

function renderPersonOptions() {
  const people = FamilyUtils.getAllPeople();

  startPerson.innerHTML = "";
  endPerson.innerHTML = "";

  people.forEach((person) => {
    const optionA = document.createElement("option");
    optionA.value = person.id;
    optionA.textContent = person.name;

    const optionB = document.createElement("option");
    optionB.value = person.id;
    optionB.textContent = person.name;

    startPerson.appendChild(optionA);
    endPerson.appendChild(optionB);
  });

  console.log("Dropdown options rendered:", people.length);
}

function renderPathResult(result, startId, endId) {
  const start = FamilyUtils.getPersonById(startId);
  const end = FamilyUtils.getPersonById(endId);

  pathResult.innerHTML = "";

  if (!start || !end) {
    pathResult.innerHTML = `
      <div class="empty-family-state">
        Please select valid people.
      </div>
    `;
    return;
  }

  if (startId === endId) {
    pathResult.innerHTML = `
      <div class="path-summary-card">
        <h3>Same person selected</h3>
        <p>${start.name} is the same person.</p>
      </div>
    `;
    return;
  }

  if (!result.found) {
    pathResult.innerHTML = `
      <div class="path-summary-card">
        <h3>No connection found</h3>
        <p>No relationship path found between ${start.name} and ${end.name}.</p>
      </div>
    `;
    return;
  }

  const chain = document.createElement("div");
  chain.className = "path-chain";

  const summary = document.createElement("div");
  summary.className = "path-summary-card";

  const smartSentence = getSmartRelationSentence(start, end, result.steps);

summary.innerHTML = `
  <h3>Connection found</h3>

  <div class="smart-relation-sentence">
    ${smartSentence}
  </div>

  <p>
    Path length:
    ${result.steps.length} step${result.steps.length === 1 ? "" : "s"}.
  </p>
`;

  pathResult.appendChild(summary);

  const firstPersonCard = createPathPersonCard(start);
  chain.appendChild(firstPersonCard);

  result.steps.forEach((step) => {
    const nextPerson = FamilyUtils.getPersonById(step.to);

    const connector = document.createElement("div");
    connector.className = "path-connector";
    connector.innerHTML = `
      <span>${step.label}</span>
    `;

    chain.appendChild(connector);
    chain.appendChild(createPathPersonCard(nextPerson));
  });

  pathResult.appendChild(chain);
}

function createPathPersonCard(person) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "path-person-card";

  card.innerHTML = `
    <span>${FamilyUtils.getInitials(person.name)}</span>
    <strong>${person.name}</strong>
  `;

  card.addEventListener("click", () => {
    window.location.href = `profile.html?id=${person.id}`;
  });

  return card;
}

findPathBtn.addEventListener("click", () => {
  const result = findShortestPath(startPerson.value, endPerson.value);
  renderPathResult(result, startPerson.value, endPerson.value);
});

swapPeopleBtn.addEventListener("click", () => {
  const oldStart = startPerson.value;
  startPerson.value = endPerson.value;
  endPerson.value = oldStart;

  const result = findShortestPath(startPerson.value, endPerson.value);
  renderPathResult(result, startPerson.value, endPerson.value);
});

async function initPathPage() {
  pathResult.innerHTML = `
    <div class="empty-family-state">
      Loading people from backend...
    </div>
  `;

  const loadResult = await FamilyUtils.loadData();

  console.log("Path page backend load:", loadResult);
  console.log("People loaded:", FamilyUtils.getAllPeople());
  console.log("Relationships loaded:", FamilyUtils.getAllRelationships());

  const people = FamilyUtils.getAllPeople();

    if (!people || people.length === 0) {
      window.location.href = "setup-profile.html";
      return;
    }

    if (people.length < 2) {
      pathResult.innerHTML = `
        <div class="empty-family-state">
          Add at least two people to find a relationship path.
        </div>
      `;
      return;
    }

  startPerson.value = people[0].id;
  endPerson.value = people[1].id;

  const initialResult = findShortestPath(startPerson.value, endPerson.value);
  renderPathResult(initialResult, startPerson.value, endPerson.value);
}

initPathPage();
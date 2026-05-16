const fromPersonSelect = document.getElementById("fromPersonSelect");
const toPersonSelect = document.getElementById("toPersonSelect");
const swapPathBtn = document.getElementById("swapPathBtn");
const findPathBtn = document.getElementById("findPathBtn");
const pathResult = document.getElementById("pathResult");

function populatePersonDropdowns() {
  const people = FamilyUtils.getAllPeople();

  if (!fromPersonSelect || !toPersonSelect) {
    console.error("Path dropdown IDs not found.");
    return;
  }

  fromPersonSelect.innerHTML = `<option value="">Select person</option>`;
  toPersonSelect.innerHTML = `<option value="">Select person</option>`;

  people.forEach((person) => {
    const fromOption = document.createElement("option");
    fromOption.value = person.id;
    fromOption.textContent = person.name;

    const toOption = document.createElement("option");
    toOption.value = person.id;
    toOption.textContent = person.name;

    fromPersonSelect.appendChild(fromOption);
    toPersonSelect.appendChild(toOption);
  });
}

function buildGraph() {
  const relationships = FamilyUtils.getAllRelationships();
  const graph = new Map();

  function addConnection(from, to, relation, direction) {
    if (!graph.has(from)) {
      graph.set(from, []);
    }

    graph.get(from).push({
      from,
      to,
      relation,
      direction
    });
  }

  relationships.forEach((relation) => {
    addConnection(relation.from, relation.to, relation, "forward");
    addConnection(relation.to, relation.from, relation, "reverse");
  });

  return graph;
}

function findShortestPath(startId, endId) {
  if (startId === endId) {
    return {
      peoplePath: [startId],
      steps: []
    };
  }

  const graph = buildGraph();
  const queue = [
    {
      personId: startId,
      peoplePath: [startId],
      steps: []
    }
  ];

  const visited = new Set([startId]);

  while (queue.length > 0) {
    const current = queue.shift();
    const connections = graph.get(current.personId) || [];

    for (const connection of connections) {
      if (visited.has(connection.to)) continue;

      const nextPeoplePath = [...current.peoplePath, connection.to];
      const nextSteps = [...current.steps, connection];

      if (connection.to === endId) {
        return {
          peoplePath: nextPeoplePath,
          steps: nextSteps
        };
      }

      visited.add(connection.to);

      queue.push({
        personId: connection.to,
        peoplePath: nextPeoplePath,
        steps: nextSteps
      });
    }
  }

  return null;
}

function getRelationName(step, currentPerson, nextPerson) {
  const relation = step.relation;
  const isForward = step.direction === "forward";

  if (relation.type === "PARENT_OF") {
    if (isForward) {
      if (nextPerson.gender === "male") return "son";
      if (nextPerson.gender === "female") return "daughter";
      return "child";
    }

    if (nextPerson.gender === "male") return "father";
    if (nextPerson.gender === "female") return "mother";
    return "parent";
  }

  if (relation.type === "MARRIED_TO") {
    if (nextPerson.gender === "male") return "husband";
    if (nextPerson.gender === "female") return "wife";
    return "spouse";
  }

  if (relation.type === "FRIEND_OF") return "friend";
  if (relation.type === "SIBLING_OF") return "sibling";
  if (relation.type === "BROTHER_OF") return "brother";
  if (relation.type === "SISTER_OF") return "sister";

  if (relation.type === "GRANDFATHER_OF") {
    return isForward ? "grandchild" : "grandfather";
  }

  if (relation.type === "GRANDMOTHER_OF") {
    return isForward ? "grandchild" : "grandmother";
  }

  if (relation.type === "PATERNAL_UNCLE_OF") {
    return isForward ? "nephew/niece" : "paternal uncle";
  }

  if (relation.type === "PATERNAL_AUNT_OF") {
    return isForward ? "nephew/niece" : "paternal aunt";
  }

  if (relation.type === "MATERNAL_UNCLE_OF") {
    return isForward ? "nephew/niece" : "maternal uncle";
  }

  if (relation.type === "MATERNAL_AUNT_OF") {
    return isForward ? "nephew/niece" : "maternal aunt";
  }

  if (relation.type === "COUSIN_OF") return "cousin";
  if (relation.type === "NEPHEW_OF") return isForward ? "uncle/aunt" : "nephew";
  if (relation.type === "NIECE_OF") return isForward ? "uncle/aunt" : "niece";

  return "related";
}

const assameseRelationMap = {
  father: "দেউতা",
  mother: "মা",
  parent: "অভিভাৱক",
  son: "পুত্ৰ",
  daughter: "কন্যা",
  child: "সন্তান",
  husband: "স্বামী",
  wife: "স্ত্ৰী",
  spouse: "জীৱনসঙ্গী",
  friend: "বন্ধু",
  sibling: "ভাই / ভনী",
  brother: "ভাই",
  sister: "ভনী",
  grandfather: "ককা",
  grandmother: "আইতা",
  grandchild: "নাতি / নাতিনী",
  "paternal uncle": "দেউতা ফালৰ খুড়া / জেঠা",
  "paternal aunt": "পেহী",
  "maternal uncle": "মামা",
  "maternal aunt": "মাহী",
  cousin: "কাজিন / সম্পৰ্কীয় ভাই-ভনী",
  nephew: "ভতিজা / ভাগিনা",
  niece: "ভতিজী / ভাগিনী",
  "nephew/niece": "ভতিজা / ভতিজী / ভাগিনা / ভাগিনী",
  "uncle/aunt": "খুড়া / মামা / পেহী / মাহী",
  related: "সম্পৰ্কীয়"
};

function getSmartRelationSentence(startPerson, endPerson, result) {
  if (result.steps.length === 0) {
    return `${startPerson.name} and ${endPerson.name} are the same person.`;
  }

  if (result.steps.length === 1) {
    const step = result.steps[0];
    const relationName = getRelationName(step, startPerson, endPerson);

    return `${endPerson.name} is ${startPerson.name}'s ${relationName}.`;
  }

  return `${startPerson.name} and ${endPerson.name} are connected through ${result.steps.length} relationship steps.`;
}

function getAssameseSentence(startPerson, endPerson, result) {
  if (result.steps.length === 0) {
    return `${startPerson.name} আৰু ${endPerson.name} একেই ব্যক্তি।`;
  }

  if (result.steps.length === 1) {
    const step = result.steps[0];
    const relationName = getRelationName(step, startPerson, endPerson);
    const assameseRelation = assameseRelationMap[relationName] || "সম্পৰ্কীয়";

    return `${endPerson.name} হৈছে ${startPerson.name}ৰ ${assameseRelation}।`;
  }

  return `${startPerson.name} আৰু ${endPerson.name}ৰ মাজত ${result.steps.length}টা সম্পৰ্কীয় ধাপ আছে।`;
}

function renderPathResult(result, startId, endId) {
  const startPerson = FamilyUtils.getPersonById(startId);
  const endPerson = FamilyUtils.getPersonById(endId);

  if (!startPerson || !endPerson) {
    pathResult.innerHTML = `<div class="empty-family-state">Please select valid people.</div>`;
    return;
  }

  if (!result) {
    pathResult.innerHTML = `
      <section class="path-summary-card">
        <h3>No relationship path found</h3>
        <p>${startPerson.name} and ${endPerson.name} are not connected yet.</p>
        <p class="assamese-relation-sentence">
          ${startPerson.name} আৰু ${endPerson.name}ৰ মাজত এতিয়ালৈকে কোনো সম্পৰ্ক যোগ কৰা হোৱা নাই।
        </p>
      </section>
    `;
    return;
  }

  const smartSentence = getSmartRelationSentence(startPerson, endPerson, result);
  const assameseSentence = getAssameseSentence(startPerson, endPerson, result);

  const pathCards = result.peoplePath
    .map((personId, index) => {
      const person = FamilyUtils.getPersonById(personId);
      const nextStep = result.steps[index];

      return `
        <div class="path-person-card">
          <strong>${person.name}</strong>
          <small>${person.gender || "unknown"}</small>
        </div>

        ${
          nextStep
            ? `<div class="path-connector">
                ${getRelationName(
                  nextStep,
                  FamilyUtils.getPersonById(nextStep.from),
                  FamilyUtils.getPersonById(nextStep.to)
                )}
              </div>`
            : ""
        }
      `;
    })
    .join("");

  pathResult.innerHTML = `
    <section class="path-summary-card">
      <h3>Connection found</h3>

      <div class="smart-relation-sentence">
        ${smartSentence}
      </div>

      <div class="smart-relation-sentence assamese-relation-sentence">
        ${assameseSentence}
      </div>

      <p>
        Path length: ${result.steps.length} step${result.steps.length === 1 ? "" : "s"}.
      </p>
    </section>

    <section class="path-chain">
      ${pathCards}
    </section>
  `;
}

function handleFindPath() {
  const fromId = fromPersonSelect.value;
  const toId = toPersonSelect.value;

  if (!fromId || !toId) {
    pathResult.innerHTML = `<div class="empty-family-state">Please select valid people.</div>`;
    return;
  }

  const result = findShortestPath(fromId, toId);
  renderPathResult(result, fromId, toId);
}

function handleSwap() {
  const oldFrom = fromPersonSelect.value;
  fromPersonSelect.value = toPersonSelect.value;
  toPersonSelect.value = oldFrom;
}

async function initPathPage() {
  if (pathResult) {
    pathResult.innerHTML = "Loading people...";
  }

  const result = await FamilyUtils.loadData();

  if (!result.success) {
    pathResult.innerHTML = result.message;
    return;
  }

  const people = FamilyUtils.getAllPeople();

  if (!people || people.length === 0) {
    window.location.href = "setup-profile.html";
    return;
  }

  populatePersonDropdowns();

  if (people.length < 2) {
    pathResult.innerHTML = `
      <div class="empty-family-state">
        Add at least two people to find a relationship path.
      </div>
    `;
    return;
  }

  pathResult.innerHTML = "Please select valid people.";

  if (findPathBtn) {
    findPathBtn.addEventListener("click", handleFindPath);
  }

  if (swapPathBtn) {
    swapPathBtn.addEventListener("click", handleSwap);
  }
}

initPathPage();
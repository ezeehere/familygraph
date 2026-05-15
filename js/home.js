FamilyUtils.loadData().then(() => {
  const homeSearch = document.getElementById("homeSearch");
  const searchResults = document.getElementById("searchResults");

function renderSearchResults() {
  const value = homeSearch.value.trim().toLowerCase();
  searchResults.innerHTML = "";

  if (!value) return;

  const matches = FamilyUtils.getAllPeople().filter((person) => {
    return person.name.toLowerCase().includes(value);
  });

  if (matches.length === 0) {
    searchResults.innerHTML = `<p class="empty-text">No person found</p>`;
    return;
  }

  matches.forEach((person) => {
    const button = document.createElement("button");
    button.className = "search-result";
    button.type = "button";
    button.textContent = person.name;

    button.addEventListener("click", () => {
      FamilyUtils.openTree(person.id);
    });

    searchResults.appendChild(button);
  });
}

homeSearch.addEventListener("input", renderSearchResults);
});
const FamilyUtils = {
  dataCache: {
    people: [],
    relationships: []
  },

  isLoaded: false,
async request(path, options = {}) {
  return await window.FamilyApi.request(path, options);
},
  renderBackendStatus(status, message) {
  const navLinks = document.querySelector(".nav-links");

  if (!navLinks) return;

  let statusPill = document.getElementById("backendStatus");

  if (!statusPill) {
    statusPill = document.createElement("div");
    statusPill.id = "backendStatus";
    navLinks.appendChild(statusPill);
  }

  

  statusPill.className = `backend-status backend-status-${status}`;

  statusPill.innerHTML = `
    <span></span>
    <p>${message}</p>
  `;

  
},

async resetBackendData() {
  try {
    const result = await this.request("/data/reset", {
      method: "POST"
    });

    await this.loadData();

    return {
      success: true,
      message: result.message || "Database reset."
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
},

async checkBackendHealth() {
  this.renderBackendStatus("checking", "Checking backend");

  try {
    const result = await this.request("/health");

    if (result.status === "ok") {
      this.renderBackendStatus("online", "Backend connected");
      return true;
    }

    this.renderBackendStatus("offline", "Backend issue");
    return false;
  } catch (error) {
    this.renderBackendStatus("offline", "Backend offline");
    return false;
  }
},


  async loadData() {
  try {
    const [people, relationships] = await Promise.all([
      this.request("/people"),
      this.request("/relationships")
    ]);

    this.dataCache = {
      people,
      relationships
    };

    this.isLoaded = true;
    this.renderBackendStatus("online", "Backend connected");

    return {
      success: true,
      message: "Backend data loaded."
    };
  } catch (error) {
    console.error("Backend load failed:", error);

    const fallbackData = window.FAMILY_DATA || {
      people: [],
      relationships: []
    };

    this.dataCache = {
      people: fallbackData.people || [],
      relationships: fallbackData.relationships || []
    };

    this.isLoaded = true;
    this.renderBackendStatus("offline", "Backend offline");

    return {
      success: false,
      message: "Backend failed. Loaded fallback data."
    };
  }
},


  getBaseData() {
    return window.FAMILY_DATA || {
      people: [],
      relationships: []
    };
  },

  getAllPeople() {
    if (this.isLoaded) {
      return this.dataCache.people;
    }

    return this.getBaseData().people;
  },

  getAllRelationships() {
    if (this.isLoaded) {
      return this.dataCache.relationships;
    }

    return this.getBaseData().relationships;
  },

  async addPerson(person) {
  try {
    const result = await this.request("/people", {
      method: "POST",
      body: JSON.stringify(person)
    });

    await this.loadData();

    return {
      success: true,
      message: result.message || "Person added.",
      person: result.person
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
},
  async updatePerson(personId, updatedData) {
    try {
      const result = await this.request(`/people/${personId}`, {
        method: "PUT",
        body: JSON.stringify(updatedData)
      });

      await this.loadData();

      return {
        success: true,
        message: result.message || "Person updated.",
        person: result.person
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  async deletePerson(personId) {
    try {
      const result = await this.request(`/people/${personId}`, {
        method: "DELETE"
      });

      await this.loadData();

      return {
        success: true,
        message: result.message || "Person deleted."
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  async addRelationship(fromId, toId, type) {
    try {
      const result = await this.request("/relationships", {
        method: "POST",
        body: JSON.stringify({
          from: fromId,
          to: toId,
          type
        })
      });

      await this.loadData();

      return {
        success: true,
        message: result.message || "Relationship added.",
        relationship: result.relationship
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  async deleteRelationship(relationshipId) {
    try {
      await this.request(`/relationships/${relationshipId}`, {
        method: "DELETE"
      });

      await this.loadData();

      return true;
    } catch (error) {
      console.error("Delete relationship failed:", error);
      return false;
    }
  },

  getRelationshipKey(relation) {
    return relation.id;
  },

  isCustomPerson() {
    return true;
  },

  isCustomRelationship() {
    return true;
  },

  async exportCustomData() {
    return await this.request("/data/export");
  },

  async importCustomData(importedData) {
    try {
      const result = await this.request("/data/import", {
        method: "POST",
        body: JSON.stringify(importedData)
      });

      await this.loadData();

      return {
        success: true,
        message: result.message || "Data imported."
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  },

  async clearCustomData() {
    return {
      success: false,
      message: "Clear all is disabled for backend mode. Use JSON import/reset later."
    };
  },

  getPersonById(id) {
    return this.getAllPeople().find((person) => person.id === id);
  },

  getInitials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  },

  getParents(personId) {
    return this.getAllRelationships()
      .filter((relation) => {
        return relation.type === "PARENT_OF" && relation.to === personId;
      })
      .map((relation) => this.getPersonById(relation.from))
      .filter(Boolean);
  },

  getChildren(personId) {
    return this.getAllRelationships()
      .filter((relation) => {
        return relation.type === "PARENT_OF" && relation.from === personId;
      })
      .map((relation) => this.getPersonById(relation.to))
      .filter(Boolean);
  },

  getSpouses(personId) {
    return this.getAllRelationships()
      .filter((relation) => {
        return (
          relation.type === "MARRIED_TO" &&
          (relation.from === personId || relation.to === personId)
        );
      })
      .map((relation) => {
        const spouseId = relation.from === personId ? relation.to : relation.from;
        return this.getPersonById(spouseId);
      })
      .filter(Boolean);
  },

  getSiblings(personId) {
    const parents = this.getParents(personId);
    const siblingMap = new Map();

    parents.forEach((parent) => {
      const children = this.getChildren(parent.id);

      children.forEach((child) => {
        if (child.id !== personId) {
          siblingMap.set(child.id, child);
        }
      });
    });

    return Array.from(siblingMap.values());
  },

  getPersonIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  },

  openTree(personId) {
    window.location.href = `tree.html?id=${personId}`;
  },

  getRelationLabel(person, relationType) {
    if (relationType === "parent") {
      if (person.gender === "male") return "Father";
      if (person.gender === "female") return "Mother";
      return "Parent";
    }

    if (relationType === "child") {
      if (person.gender === "male") return "Son";
      if (person.gender === "female") return "Daughter";
      return "Child";
    }

    if (relationType === "sibling") {
      if (person.gender === "male") return "Brother";
      if (person.gender === "female") return "Sister";
      return "Sibling";
    }

    if (relationType === "spouse") {
      return "Spouse";
    }

    return person.note || "Family member";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  FamilyUtils.checkBackendHealth();
});
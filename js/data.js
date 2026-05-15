window.FAMILY_DATA = {
  people: [
    {
      id: "harish",
      name: "Harish Kapoor",
      gender: "male",
      birthYear: 1948,
      note: "Family elder"
    },
    {
      id: "savita",
      name: "Savita Kapoor",
      gender: "female",
      birthYear: 1952,
      note: "Family elder"
    },
    {
      id: "rajiv",
      name: "Rajiv Kapoor",
      gender: "male",
      birthYear: 1976,
      note: "Second generation"
    },
    {
      id: "meera",
      name: "Meera Kapoor",
      gender: "female",
      birthYear: 1979,
      note: "Second generation"
    },
    {
      id: "anil",
      name: "Anil Kapoor",
      gender: "male",
      birthYear: 1980,
      note: "Second generation"
    },
    {
      id: "pooja",
      name: "Pooja Kapoor",
      gender: "female",
      birthYear: 1983,
      note: "Second generation"
    },
    {
      id: "aarav",
      name: "Aarav Kapoor",
      gender: "male",
      birthYear: 2001,
      note: "Third generation"
    },
    {
      id: "riya",
      name: "Riya Kapoor",
      gender: "female",
      birthYear: 2004,
      note: "Third generation"
    },
    {
      id: "kabir",
      name: "Kabir Kapoor",
      gender: "male",
      birthYear: 2008,
      note: "Third generation"
    },
    {
      id: "nisha",
      name: "Nisha Kapoor",
      gender: "female",
      birthYear: 2002,
      note: "Married to Aarav"
    },
    {
      id: "vihaan",
      name: "Vihaan Kapoor",
      gender: "male",
      birthYear: 2028,
      note: "Fourth generation"
    },
    {
      id: "tara",
      name: "Tara Kapoor",
      gender: "female",
      birthYear: 2030,
      note: "Fourth generation"
    }
  ],

  relationships: [
    {
      from: "harish",
      to: "savita",
      type: "MARRIED_TO"
    },
    {
      from: "rajiv",
      to: "meera",
      type: "MARRIED_TO"
    },
    {
      from: "aarav",
      to: "nisha",
      type: "MARRIED_TO"
    },

    {
      from: "harish",
      to: "rajiv",
      type: "PARENT_OF"
    },
    {
      from: "savita",
      to: "rajiv",
      type: "PARENT_OF"
    },
    {
      from: "harish",
      to: "anil",
      type: "PARENT_OF"
    },
    {
      from: "savita",
      to: "anil",
      type: "PARENT_OF"
    },
    {
      from: "harish",
      to: "pooja",
      type: "PARENT_OF"
    },
    {
      from: "savita",
      to: "pooja",
      type: "PARENT_OF"
    },

    {
      from: "rajiv",
      to: "aarav",
      type: "PARENT_OF"
    },
    {
      from: "meera",
      to: "aarav",
      type: "PARENT_OF"
    },
    {
      from: "rajiv",
      to: "riya",
      type: "PARENT_OF"
    },
    {
      from: "meera",
      to: "riya",
      type: "PARENT_OF"
    },
    {
      from: "rajiv",
      to: "kabir",
      type: "PARENT_OF"
    },
    {
      from: "meera",
      to: "kabir",
      type: "PARENT_OF"
    },

    {
      from: "aarav",
      to: "vihaan",
      type: "PARENT_OF"
    },
    {
      from: "nisha",
      to: "vihaan",
      type: "PARENT_OF"
    },
    {
      from: "aarav",
      to: "tara",
      type: "PARENT_OF"
    },
    {
      from: "nisha",
      to: "tara",
      type: "PARENT_OF"
    }
  ]
};
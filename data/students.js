/* eslint-disable */
/**
 * Datos del curso y lista oficial de 39 alumnos extraída del CSV de Canvas LMS.
 * Se conserva `canvasStudent` exactamente igual al archivo original para garantizar
 * la coincidencia exacta al volver a importar las notas en Canvas.
 */
(function (global) {
  "use strict";

  global.EcoRubric = global.EcoRubric || {};

  global.EcoRubric.COURSE_META = {
    courseTitle: "Economy",
    subtitle: "Rúbrica de Presentaciones Orales",
    section: "2627-88052-A INGLÉS",
    defaultAssignmentName: "Final Class Presentation",
    defaultTopics: ["Tema 1", "Tema 2", "Tema 3", "Tema 4"],
    pointsPossible: 10,
    scoreOptions: [0, 3, 5, 7, 10],
    days: [1, 2, 3],
    storageKey: "eco_rubric_v1_2627_88052_A"
  };

  global.EcoRubric.STUDENTS = [
  {
    "id": "113447",
    "canvasStudent": "Boullail , Ayoub",
    "displayName": "Boullail, Ayoub",
    "sisLoginId": "26DD55615",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113431",
    "canvasStudent": "Cormack , Niall Alistair",
    "displayName": "Cormack, Niall Alistair",
    "sisLoginId": "PF2758253",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113368",
    "canvasStudent": "Detta , Leo",
    "displayName": "Detta, Leo",
    "sisLoginId": "CA05772VI",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113547",
    "canvasStudent": "El Saeidy , El Said",
    "displayName": "El Saeidy, El Said",
    "sisLoginId": "200375550656",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113704",
    "canvasStudent": "Ferrari , Greta",
    "displayName": "Ferrari, Greta",
    "sisLoginId": "CA97965PN",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113705",
    "canvasStudent": "Foti , Giorgio",
    "displayName": "Foti, Giorgio",
    "sisLoginId": "CA99237XB",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113504",
    "canvasStudent": "Friderich Diego, Yanick Alexander",
    "displayName": "Friderich Diego, Yanick Alexander",
    "sisLoginId": "56295910",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113677",
    "canvasStudent": "Friedl , Lillian June",
    "displayName": "Friedl, Lillian June",
    "sisLoginId": "A73997400",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113576",
    "canvasStudent": "Han , Sol",
    "displayName": "Han, Sol",
    "sisLoginId": "M008A0781",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113582",
    "canvasStudent": "Hernandez Ali, Carolina",
    "displayName": "Hernandez Ali, Carolina",
    "sisLoginId": "BE381313",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113458",
    "canvasStudent": "Kähler  Lilly",
    "displayName": "Kähler Lilly",
    "sisLoginId": "C95XC9FP1",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113531",
    "canvasStudent": "Kapsdorferova , Ema",
    "displayName": "Kapsdorferova, Ema",
    "sisLoginId": "JH204262",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113373",
    "canvasStudent": "Kneppers , Mara",
    "displayName": "Kneppers, Mara",
    "sisLoginId": "ITK8BB1J7",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113722",
    "canvasStudent": "Lind , Selma Rut Gerda",
    "displayName": "Lind, Selma Rut Gerda",
    "sisLoginId": "EA1320685",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113389",
    "canvasStudent": "Magiera , Leticia Vanessa",
    "displayName": "Magiera, Leticia Vanessa",
    "sisLoginId": "L8LKT41GP",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113453",
    "canvasStudent": "Meudec , Louise Lena Marie",
    "displayName": "Meudec, Louise Lena Marie",
    "sisLoginId": "K8GXN8KX9",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113501",
    "canvasStudent": "Mirra , Maria Chiara",
    "displayName": "Mirra, Maria Chiara",
    "sisLoginId": "YB9257212",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113529",
    "canvasStudent": "Nerantzaki , Ekaterini",
    "displayName": "Nerantzaki, Ekaterini",
    "sisLoginId": "L8HNR6TM7",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113490",
    "canvasStudent": "Overgaard , Emily Anna",
    "displayName": "Overgaard, Emily Anna",
    "sisLoginId": "EA3103590",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113446",
    "canvasStudent": "Palffy , Levente",
    "displayName": "Palffy, Levente",
    "sisLoginId": "338093NE",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113578",
    "canvasStudent": "Patel , Gracey",
    "displayName": "Patel, Gracey",
    "sisLoginId": "P513374NG",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113536",
    "canvasStudent": "Peeters , Jon Lennart",
    "displayName": "Peeters, Jon Lennart",
    "sisLoginId": "ILBK31L81",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113730",
    "canvasStudent": "Podlesnik , Savannah",
    "displayName": "Podlesnik, Savannah",
    "sisLoginId": "P507899DP",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113409",
    "canvasStudent": "Power , Aoife Mary",
    "displayName": "Power, Aoife Mary",
    "sisLoginId": "PL0899518",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113352",
    "canvasStudent": "Santonicola , Valentina",
    "displayName": "Santonicola, Valentina",
    "sisLoginId": "CA00462NQ",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113505",
    "canvasStudent": "Schin , Arina",
    "displayName": "Schin, Arina",
    "sisLoginId": "IZ088328",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113435",
    "canvasStudent": "Schnell , Maximilian",
    "displayName": "Schnell, Maximilian",
    "sisLoginId": "L17KH75ZH",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113755",
    "canvasStudent": "Schoning , Can Nelio",
    "displayName": "Schoning, Can Nelio",
    "sisLoginId": "L6X57RLW9",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113708",
    "canvasStudent": "Sheahan , Abigail",
    "displayName": "Sheahan, Abigail",
    "sisLoginId": "PL6589604",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113374",
    "canvasStudent": "Simonini , Martina",
    "displayName": "Simonini, Martina",
    "sisLoginId": "CA61188UD",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113540",
    "canvasStudent": "Szabó , Tamás Lajos",
    "displayName": "Szabó, Tamás Lajos",
    "sisLoginId": "376484SE",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113400",
    "canvasStudent": "Tornquist , Hedda Helena",
    "displayName": "Tornquist, Hedda Helena",
    "sisLoginId": "AA3705764",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113507",
    "canvasStudent": "Venturin , Laura",
    "displayName": "Venturin, Laura",
    "sisLoginId": "CA35038PF",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113425",
    "canvasStudent": "Verhulst , Mats",
    "displayName": "Verhulst, Mats",
    "sisLoginId": "595618980458",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113481",
    "canvasStudent": "Wyneken , Joel Aime",
    "displayName": "Wyneken, Joel Aime",
    "sisLoginId": "L88NZJM9",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113698",
    "canvasStudent": "Yilmaz , Cemil",
    "displayName": "Yilmaz, Cemil",
    "sisLoginId": "U39847668",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113571",
    "canvasStudent": "Yoo , Geumjeong",
    "displayName": "Yoo, Geumjeong",
    "sisLoginId": "M970H4774",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113573",
    "canvasStudent": "You , Chaehyeon",
    "displayName": "You, Chaehyeon",
    "sisLoginId": "M701Q4141",
    "section": "2627-88052-A INGLÉS"
  },
  {
    "id": "113467",
    "canvasStudent": "Zollner , Patrick",
    "displayName": "Zollner, Patrick",
    "sisLoginId": "LF449CRFK",
    "section": "2627-88052-A INGLÉS"
  }
];
})(typeof window !== "undefined" ? window : globalThis);

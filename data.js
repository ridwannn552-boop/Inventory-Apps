// ==========================
// DATA USER
// ==========================
const USERS = [
  { nik: "1001", password: "admin123", role: "admin", nama: "ADMIN", dept: "ALL" },
  { nik: "2001", password: "123", role: "leader", nama: "Agus Riyadi", dept: "METAL" },
  { nik: "2002", password: "123", role: "leader", nama: "Maryanto", dept: "PLASTIK" },
  { nik: "2003", password: "123", role: "leader", nama: "Aprianto H", dept: "BUFFING" },
  { nik: "2004", password: "123", role: "leader", nama: "Nazmudin", dept: "MUFFLER" }
];

// ==========================
// DATA / CONFIG
// ==========================
let produkMaster = [];
let historyTransaksi = [];

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzEHh3in4BFoFyREjL2vzzqWGK8GEHl1kjndJ0P7b-Oawwt3we1_K4VNM3-0d-cGiVI/exec";
const URL_PRODUK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&output=csv";

'use strict';
// Uso: node scripts/hash.js "minha senha"
const { hashPassword } = require('../lib/auth');
const pw = process.argv[2];
if (!pw || pw.length < 10) { console.error('Use uma senha com 10+ caracteres: node scripts/hash.js "sua senha"'); process.exit(1); }
console.log(hashPassword(pw));

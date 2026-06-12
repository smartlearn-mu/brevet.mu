// ============================================================
// SMART LEARN — PROXY DEEPSEEK + MONÉTISATION
// Contact = email (Réunion) ou WhatsApp (Maurice)
// ============================================================

var COUT_DEEPSEEK_USD   = 0.0002;
var PRIX_ABONNEMENT_EUR = 29.0;
var PRIX_ABONNEMENT_MU  = 990;
var TAUX_EUR_USD        = 1.08;

// ============================================================
// GET — test de vie
// ============================================================

function doGet() {
  return ContentService
    .createTextOutput('Smart Learn Proxy OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ============================================================
// POST — point d'entrée principal
// ============================================================

function doPost(e) {
  try {
    if (!e) return rep({ success: false, error: 'Pas de données' });

    var params;
    if (e.parameter && e.parameter.data) {
      params = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else {
      return rep({ success: false, error: 'Pas de données' });
    }

    var action    = params.action    || '';
    var userId    = params.userId    || 'anonymous';
    var sessionId = params.sessionId || 'unknown';
    var estPayant = params.estPayant === true;
    var joursEssai= params.joursRestantsEssai || 0;
    var source    = params.source    || '';
    var matiere   = params.matiere   || 'inconnu';

    // ── Correction IA ─────────────────────────────────────
    if (action === 'correction_ia') {
      var debut  = Date.now();
      var result = appelerDeepSeek(params.prompt, params.system);
      var duree  = (Date.now() - debut) / 1000;
      var note   = extraireNote(result);
      var statut = estPayant ? 'payant' : (joursEssai > 0 ? 'essai_j' + joursEssai : 'essai');
      var coutUSD = COUT_DEEPSEEK_USD;
      var coutEUR = coutUSD / TAUX_EUR_USD;
      var nbCorr  = getCount(userId);
      var profit  = estPayant ? (PRIX_ABONNEMENT_EUR / Math.max(1, nbCorr + 1)) - coutEUR : -coutEUR;

      logStat(userId, sessionId, action, matiere, statut, estPayant, joursEssai, note,
              coutUSD, coutEUR, 0, profit, duree, source,
              Math.round((params.prompt || '').length / 4));
      majClient(userId, estPayant, matiere, coutUSD);
      setCount(userId, nbCorr + 1);

      return rep({ success: true, content: result,
        stats: { estPayant: estPayant, joursEssai: joursEssai, corrections: nbCorr + 1 }});
    }

    // ── Validation code ───────────────────────────────────
    if (action === 'valider_code') {
      return validerCode(params);
    }

    // ── Stats tracker (page_view, trial_start) ────────────
    if (action === 'page_view' || action === 'trial_start') {
      logStat(userId, sessionId, action, matiere, 'essai', false,
              joursEssai, '', 0, 0, 0, 0, 0, source, 0);
      return rep({ success: true });
    }

    return rep({ success: false, error: 'Action inconnue: ' + action });

  } catch (err) {
    console.error('doPost:', err);
    return rep({ success: false, error: err.toString() });
  }
}

// ============================================================
// DEEPSEEK
// ============================================================

function appelerDeepSeek(prompt, system, temperature) {
  temperature = temperature || 0.7;
  var key = PropertiesService.getScriptProperties().getProperty('DEEPSEEK_API_KEY');
  if (!key) throw new Error('Cle API DeepSeek manquante.');
  var opts = {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    payload: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system || 'Tu es correcteur expert DNB.' },
        { role: 'user',   content: prompt }
      ],
      temperature: temperature,
      max_tokens: 2000
    }),
    muteHttpExceptions: true
  };
  var res  = UrlFetchApp.fetch('https://api.deepseek.com/v1/chat/completions', opts);
  var code = res.getResponseCode();
  var raw  = res.getContentText();
  if (code !== 200) throw new Error('DeepSeek HTTP ' + code);
  var data = JSON.parse(raw);
  if (!data.choices || !data.choices[0] || !data.choices[0].message)
    throw new Error('Structure DeepSeek inattendue');
  return data.choices[0].message.content;
}

// ============================================================
// FEUILLE STATISTIQUES
// ============================================================

function logStat(userId, sessionId, action, matiere, statut, estPayant,
                 joursEssai, note, coutUSD, coutEUR, revenue, profit,
                 duree, source, tokens) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Statistiques');
    if (!sheet) {
      sheet = ss.insertSheet('Statistiques');
      var h = ['Timestamp','UserId','SessionId','Action','Matiere','Statut',
               'EstPayant','JoursEssai','Note','Cout_USD','Cout_EUR',
               'Revenue_EUR','Profit_EUR','Duree_s','Source','Tokens','Success'];
      sheet.getRange(1,1,1,h.length).setValues([h])
           .setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date().toISOString(), userId, sessionId, action, matiere, statut,
      estPayant, joursEssai, note, coutUSD, coutEUR, revenue, profit,
      duree, source, tokens, true]);
  } catch(e) { console.error('logStat:', e); }
}

// ============================================================
// FEUILLE CLIENTS
// ============================================================

function majClient(userId, estPayant, matiere, coutUSD) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Clients');
    if (!sheet) {
      sheet = ss.insertSheet('Clients');
      var h = ['UserId','Contact','Code','Statut','PremierContact','DernierContact',
               'NbCorrections','CoutTotal_USD','CoutTotal_EUR','Revenu','ProfitNet_EUR',
               'Matieres','ConversionDate'];
      sheet.getRange(1,1,1,h.length).setValues([h])
           .setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    var data = sheet.getDataRange().getValues();
    var now  = new Date().toISOString();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        var nb  = (data[i][6] || 0) + 1;
        var cu  = (data[i][7] || 0) + coutUSD;
        var ce  = cu / TAUX_EUR_USD;
        var mat = data[i][11] || '';
        if (mat.indexOf(matiere) === -1) mat += (mat ? ', ' : '') + matiere;
        sheet.getRange(i+1,4).setValue(estPayant ? 'payant' : (data[i][3] || 'essai'));
        sheet.getRange(i+1,6).setValue(now);
        sheet.getRange(i+1,7).setValue(nb);
        sheet.getRange(i+1,8).setValue(Math.round(cu*10000)/10000);
        sheet.getRange(i+1,9).setValue(Math.round(ce*10000)/10000);
        sheet.getRange(i+1,12).setValue(mat);
        return;
      }
    }
    sheet.appendRow([userId,'','',estPayant?'payant':'essai',now,now,1,
      Math.round(coutUSD*10000)/10000,
      Math.round((coutUSD/TAUX_EUR_USD)*10000)/10000,
      0, Math.round(-(coutUSD/TAUX_EUR_USD)*100)/100,
      matiere, estPayant ? now : '']);
  } catch(e) { console.error('majClient:', e); }
}

// ============================================================
// FEUILLE CODES
// ============================================================

function validerCode(params) {
  var code   = (params.code || '').toString().trim();
  var userId = params.userId || 'anonymous';
  if (!code) return rep({ success: false, error: 'Code manquant' });
  try {
    var sheet = getCodesSheet();
    var data  = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if ((data[i][0] || '').toString().trim() === code) {
        sheet.getRange(i+1,4).setValue(true);
        sheet.getRange(i+1,5).setValue(new Date().toISOString());
        sheet.getRange(i+1,6).setValue(userId);
        lierContact(userId, data[i][1] || '', code);
        return rep({ success: true, message: 'Code valide ! Acces complet debloque.' });
      }
    }
    return rep({ success: false, error: 'Code invalide.' });
  } catch(err) {
    return rep({ success: false, error: err.toString() });
  }
}

function lierContact(userId, contact, code) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients');
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        sheet.getRange(i+1,2).setValue(contact);
        sheet.getRange(i+1,3).setValue(code);
        sheet.getRange(i+1,4).setValue('payant');
        sheet.getRange(i+1,10).setValue(PRIX_ABONNEMENT_MU);
        sheet.getRange(i+1,13).setValue(new Date().toISOString());
        return;
      }
    }
  } catch(e) { console.error('lierContact:', e); }
}

function getCodesSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Codes');
  if (!sheet) {
    sheet = ss.insertSheet('Codes');
    var h = ['Code','Contact','DateCreation','Utilise','DateUtilisation','UserId','Notes'];
    sheet.getRange(1,1,1,h.length).setValues([h])
         .setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
    sheet.setColumnWidth(1,150);
    sheet.setColumnWidth(2,200);
  }
  return sheet;
}

// ============================================================
// COMPTEURS (Cache)
// ============================================================

function getCount(userId) {
  var cache  = CacheService.getScriptCache();
  var cached = cache.get('cnt_' + userId);
  if (cached !== null) return parseInt(cached, 10);
  var n = countFromSheet(userId);
  cache.put('cnt_' + userId, n.toString(), 600);
  return n;
}

function setCount(userId, n) {
  CacheService.getScriptCache().put('cnt_' + userId, n.toString(), 600);
  writeCountSheet(userId, n);
}

function countFromSheet(userId) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Compteurs');
    if (!sheet) return 0;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) return parseInt(data[i][1], 10) || 0;
    }
    return 0;
  } catch(e) { return 0; }
}

function writeCountSheet(userId, n) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Compteurs');
    if (!sheet) {
      sheet = ss.insertSheet('Compteurs');
      sheet.getRange(1,1,1,2).setValues([['UserId','NbCorrections']]);
    }
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === userId) { sheet.getRange(i+1,2).setValue(n); return; }
    }
    sheet.appendRow([userId, n]);
  } catch(e) { console.error('writeCount:', e); }
}

// ============================================================
// ADMIN — GÉNÉRATION DE CODES
// ============================================================

function generateCode() {
  // Modifier avant d'executer :
  var contact = '+230XXXXXXXX';   // email@exemple.com ou +230XXXXXXXX
  var notes   = '';

  var code = genCode();
  getCodesSheet().appendRow([code, contact, new Date().toISOString(), false, '', '', notes]);

  console.log('========================================');
  console.log('Contact : ' + contact);
  console.log('Code    : ' + code);
  console.log('========================================');
  return { code: code, contact: contact };
}

function generateCodesPourListe() {
  var clients = [
    { contact: '+230XXXXXXXX', notes: 'Juice 12/06' },
    { contact: '+230YYYYYYYY', notes: 'Juice 12/06' }
  ];
  for (var i = 0; i < clients.length; i++) {
    var code = genCode();
    getCodesSheet().appendRow([code, clients[i].contact,
      new Date().toISOString(), false, '', '', clients[i].notes]);
    console.log(clients[i].contact + ' -> ' + code);
  }
}

function genCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var c = '';
  for (var i = 0; i < 8; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
  return c;
}

function voirCodes() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Codes');
  if (!sheet) { console.log('Pas de feuille Codes'); return; }
  var data = sheet.getDataRange().getValues();
  var actifs = 0, utilises = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][3]) {
      utilises++;
      console.log('UTILISE | ' + data[i][0] + ' | ' + data[i][1]);
    } else {
      actifs++;
      console.log('ACTIF   | ' + data[i][0] + ' | ' + data[i][1]);
    }
  }
  console.log('Actifs: ' + actifs + ' | Utilises: ' + utilises);
}

// ============================================================
// UTILITAIRES
// ============================================================

function extraireNote(txt) {
  try {
    var m = txt.match(/"note"\s*:\s*(\d+(?:\.\d+)?)/);
    if (m) return m[1];
    m = txt.match(/(\d+(?:\.\d+)?)\/(\d+)/);
    if (m) return m[1] + '/' + m[2];
    return '';
  } catch(e) { return ''; }
}

function rep(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// SETUP — exécuter une seule fois
// ============================================================

function creerFeuilles() {
  getCodesSheet();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('Statistiques')) logStat('init','','init','','',false,0,'',0,0,0,0,0,'setup',0);
  if (!ss.getSheetByName('Clients'))      majClient('init', false, 'setup', 0);
  if (!ss.getSheetByName('Compteurs'))    writeCountSheet('init', 0);
  console.log('Feuilles creees : Statistiques Clients Codes Compteurs');
}

function verifierCleAPI() {
  var key = PropertiesService.getScriptProperties().getProperty('DEEPSEEK_API_KEY');
  if (key && key.startsWith('sk-')) { console.log('Cle DeepSeek OK'); return true; }
  console.log('Cle DeepSeek MANQUANTE'); return false;
}

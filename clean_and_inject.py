#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NETTOYAGE + INJECTION MONETISATION
- Supprime les anciens blocs trial-banner, brevet_trial_start, brevet_access,
  monetization.js, monetization_mu.js, proxy-client.js
- Injecte le nouveau script inline avant </head>
"""

import os
import re

DOSSIER = r"C:\Users\pc\Desktop\brevet.mu"
HTML_EXT = ".html"

NEW_SCRIPT = r"""<script>
// SMART LEARN â€” MONÃ‰TISATION MAURICE
// Essai 2 jours Â· 999 Rs Â· WhatsApp + Juice

const MONETIZATION = {
  prix: 999, devise: 'Rs', essaiJours: 2,
  codeMaitre: 'Entrepotes974NawalWassil',
  whatsapp: 'https://wa.me/23059459402',
  numeroJuice: '+230 594 59402',
  STORAGE_KEYS: { trialStart: 'brevet_start', paidValid: 'brevet_paid' }
};

function estEnEssai() {
  var s = localStorage.getItem(MONETIZATION.STORAGE_KEYS.trialStart);
  if (!s) return true;
  return (Date.now() - parseInt(s)) / 86400000 < MONETIZATION.essaiJours;
}
function essaiExpire() {
  var s = localStorage.getItem(MONETIZATION.STORAGE_KEYS.trialStart);
  if (!s) return false;
  return (Date.now() - parseInt(s)) / 86400000 >= MONETIZATION.essaiJours;
}
function aAccesComplet() {
  if (localStorage.getItem(MONETIZATION.STORAGE_KEYS.paidValid) === 'true') return true;
  return estEnEssai();
}
function aAccesPayant() {
  return localStorage.getItem(MONETIZATION.STORAGE_KEYS.paidValid) === 'true';
}
function joursRestantsEssai() {
  var s = localStorage.getItem(MONETIZATION.STORAGE_KEYS.trialStart);
  if (!s) return MONETIZATION.essaiJours;
  return Math.max(0, Math.ceil(MONETIZATION.essaiJours - (Date.now() - parseInt(s)) / 86400000));
}
function validerCode(code, callback) {
  var PROXY = 'https://script.google.com/macros/s/AKfycbxzUhsZ4ewxV_zGsu5h_L2eryTJiW2E-gZLvihC-vPl2DimCJxAeTF2dhbDF8no-ocG/exec';
  var payload = JSON.stringify({ userId: localStorage.getItem('user_id') || 'anon', action: 'valider_code', code: code.trim(), source: document.title || '' });
  fetch(PROXY, { method: 'POST', body: new URLSearchParams({ data: payload }) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data.success) {
        localStorage.setItem(MONETIZATION.STORAGE_KEYS.paidValid, 'true');
        if (callback) callback({ success: true, message: 'âœ… AccÃ¨s dÃ©bloquÃ© !' });
      } else {
        if (callback) callback({ success: false, message: 'âŒ ' + (data.error || 'Code invalide.') });
      }
    }).catch(function() { if (callback) callback({ success: false, message: 'âŒ VÃ©rifiez votre connexion.' }); });
}
function creerBanniere() {
  if (document.getElementById('monet-banner') || aAccesPayant()) return;
  var j = joursRestantsEssai(), expire = essaiExpire();
  var bg = expire ? '#e87a7a' : '#e8c87a', col = expire ? '#fff' : '#09090f';
  var texte = expire ? 'âš ï¸ Essai terminÃ© â€” Corrections IA bloquÃ©es'
    : 'ï¿½ï¿½ Essai gratuit â€” <strong>J-' + j + '</strong> ' + (j <= 1 ? 'jour restant' : 'jours restants') + ' â€” AccÃ¨s complet <strong>999 Rs/an</strong>';
  var b = document.createElement('div');
  b.id = 'monet-banner';
  b.innerHTML = '<style>#monet-banner{position:sticky;top:0;left:0;right:0;background:' + bg + ';color:' + col + ';font-family:"DM Sans",Arial,sans-serif;font-size:13px;padding:9px 20px;z-index:9998;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;}.monet-banner-btn{padding:5px 16px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;border:none;background:' + col + ';color:' + bg + ';}</style><span>' + texte + '</span><button class="monet-banner-btn" onclick="afficherOverlay()">ï¿½ï¿½ DÃ©bloquer via WhatsApp</button>';
  document.body.insertBefore(b, document.body.firstChild);
}
function afficherOverlay() {
  if (document.getElementById('monet-overlay')) return;
  var canClose = estEnEssai();
  var o = document.createElement('div');
  o.id = 'monet-overlay';
  o.innerHTML = '<style>#monet-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(9,9,15,0.97);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:"DM Sans",Arial,sans-serif;}.monet-card{background:#111118;border:1px solid #2a2a38;border-radius:16px;padding:32px 28px;max-width:460px;width:92%;color:#e8e8f0;text-align:center;}.monet-wa-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 28px;border-radius:12px;font-weight:800;font-size:15px;text-decoration:none;background:#25D366;color:#fff;margin:12px 0;width:100%;box-sizing:border-box;border:none;cursor:pointer;}.monet-input{width:100%;background:#0d0d14;border:1px solid #2a2a38;border-radius:10px;color:#e8e8f0;font-size:15px;padding:12px 16px;text-align:center;outline:none;box-sizing:border-box;margin-bottom:10px;}.monet-btn{padding:11px 24px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;border:1px solid rgba(94,207,177,0.3);background:rgba(94,207,177,0.1);color:#5ecfb1;margin:4px;}.monet-btn.ghost{background:transparent;color:#9090a8;border:1px solid #2a2a38;}.monet-msg{font-size:13px;margin-top:10px;min-height:24px;}</style>'
    + '<div class="monet-card">'
    + '<div style="font-size:44px;margin-bottom:10px;">â°</div>'
    + '<div style="font-size:22px;font-weight:800;color:#e8c87a;margin-bottom:8px;">Essai gratuit terminÃ©</div>'
    + '<div style="font-size:14px;color:#9090a8;margin-bottom:12px;">DÃ©bloquez l\'accÃ¨s complet pour continuer.</div>'
    + '<div style="font-size:40px;font-weight:800;color:#5ecfb1;margin:8px 0;">999 Rs <span style="font-size:16px;color:#9090a8;">/ an</span></div>'
    + '<div style="background:#0d0d14;border-radius:10px;padding:14px;margin:12px 0;text-align:left;font-size:13px;line-height:2;">1ï¸âƒ£ Envoyez <strong>999 Rs</strong> par Juice au <strong>+230 594 59402</strong><br>2ï¸âƒ£ Envoyez la <strong>capture</strong> sur WhatsApp<br>3ï¸âƒ£ Recevez votre <strong>code d\'activation</strong></div>'
    + '<a href="https://wa.me/23059459402?text=' + encodeURIComponent('Bonjour, je souhaite dÃ©bloquer Hub Brevet 2026 (999 Rs). Je vous envoie ma capture Juice.') + '" target="_blank" class="monet-wa-btn">ï¿½ï¿½ Contacter sur WhatsApp</a>'
    + '<hr style="border:none;border-top:1px solid #2a2a38;margin:16px 0;">'
    + '<input type="text" class="monet-input" id="monet-code-input" placeholder="Votre code d\'accÃ¨sâ€¦" maxlength="40">'
    + '<div><button class="monet-btn" id="monet-valider">âœ“ Valider le code</button>'
    + (canClose ? '<button class="monet-btn ghost" id="monet-close">Continuer l\'essai</button>' : '')
    + '</div><div class="monet-msg" id="monet-msg"></div></div>';
  document.body.appendChild(o);
  document.getElementById('monet-valider').onclick = function() {
    var code = document.getElementById('monet-code-input').value.trim();
    var msg = document.getElementById('monet-msg');
    if (!code) { msg.style.color='#e87a7a'; msg.textContent='Entrez un code.'; return; }
    msg.style.color='#9090a8'; msg.textContent='VÃ©rification...';
    validerCode(code, function(r) {
      if (r.success) { msg.style.color='#5ecfb1'; msg.textContent=r.message; setTimeout(function(){document.getElementById('monet-overlay').remove();location.reload();},1500); }
      else { msg.style.color='#e87a7a'; msg.textContent=r.message; }
    });
  };
  var cl = document.getElementById('monet-close');
  if (cl) cl.onclick = function() { document.getElementById('monet-overlay').remove(); };
}
function afficherBlocageEssaiExpire() { afficherOverlay(); }
function initMonetization() {
  if (!localStorage.getItem(MONETIZATION.STORAGE_KEYS.trialStart))
    localStorage.setItem(MONETIZATION.STORAGE_KEYS.trialStart, Date.now().toString());
  if (!localStorage.getItem('user_id'))
    localStorage.setItem('user_id', (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'user_' + Date.now());
  if (aAccesPayant()) return;
  creerBanniere();
  if (essaiExpire()) setTimeout(afficherOverlay, 500);
  setInterval(function() {
    var b = document.getElementById('monet-banner');
    if (b && !aAccesPayant()) b.style.background = essaiExpire() ? '#e87a7a' : '#e8c87a';
  }, 60000);
}
window.aAccesComplet = aAccesComplet;
window.aAccesPayant = aAccesPayant;
window.essaiExpire = essaiExpire;
window.afficherBlocageEssaiExpire = afficherBlocageEssaiExpire;
window.afficherOverlay = afficherOverlay;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMonetization);
else initMonetization();
</script>"""

# â”€â”€ Patterns de suppression â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
REMOVE_PATTERNS = [
    # Anciennes balises <script src="...">
    r'<script[^>]*src\s*=\s*["\']monetization\.js["\'][^>]*></script>\s*',
    r'<script[^>]*src\s*=\s*["\']monetization_mu\.js["\'][^>]*></script>\s*',
    r'<script[^>]*src\s*=\s*["\']proxy-client\.js["\'][^>]*></script>\s*',
    # Anciens blocs inline contenant trial-banner, brevet_trial_start, brevet_access
    r'<script[^>]*>[\s\S]*?trial-banner[\s\S]*?</script>\s*',
    r'<script[^>]*>[\s\S]*?brevet_trial_start[\s\S]*?</script>\s*',
    r'<script[^>]*>[\s\S]*?brevet_access[\s\S]*?</script>\s*',
    # Anciens blocs <div> ou autres avec trial-banner
    r'<div[^>]*id\s*=\s*["\']trial-banner["\'][^>]*>[\s\S]*?</div>\s*',
    r'<div[^>]*class\s*=\s*["\'][^"\']*trial-banner[^"\']*["\'][^>]*>[\s\S]*?</div>\s*',
]


def nettoyer_html(content):
    """Supprime les anciennes rÃ©fÃ©rences de monÃ©tisation."""
    for pattern in REMOVE_PATTERNS:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)
    return content


def injecter_script(content):
    """Injecte le nouveau script inline juste avant </head>."""
    # VÃ©rifier si le nouveau script est dÃ©jÃ  prÃ©sent (Ã©viter double injection)
    if '// SMART LEARN â€” MONÃ‰TISATION MAURICE' in content:
        return content
    content = content.replace('</head>', NEW_SCRIPT + '\n</head>')
    return content


def traiter_fichier(path):
    """Traite un fichier HTML : nettoyage + injection."""
    with open(path, 'r', encoding='utf-8') as f:
        contenu = f.read()

    avant = contenu
    contenu = nettoyer_html(contenu)
    contenu = injecter_script(contenu)

    if contenu != avant:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(contenu)
        return True, "modifiÃ©"
    return False, "inchangÃ©"


def main():
    fichiers = [
        os.path.join(DOSSIER, f)
        for f in os.listdir(DOSSIER)
        if f.lower().endswith(HTML_EXT) and os.path.isfile(os.path.join(DOSSIER, f))
    ]

    if not fichiers:
        print(f"âŒ Aucun fichier .html trouvÃ© dans {DOSSIER}")
        return

    print("[OK] %d fichier(s) .html trouve(s)" % len(fichiers))
    print()

    compteur = 0
    for path in sorted(fichiers):
        ok, statut = traiter_fichier(path)
        nom = os.path.basename(path)
        if ok:
            print("  [MODIFIE] %s â€” %s" % (nom, statut))
            compteur += 1
        else:
            print("  [INCHANGE] %s â€” %s" % (nom, statut))

    print()
    print("[TERMINE] %d fichier(s) modifie(s) sur %d" % (compteur, len(fichiers)))


if __name__ == "__main__":
    main()

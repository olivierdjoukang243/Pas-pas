# -*- coding: utf-8 -*-
"""
Importe dans le site les titres de modules lus dans le stock de la boutique.

    python tools/importer_stock.py C:\\projets\\PasAPas\\livraison\\boutique\\stock-prive

Pour chaque dossier de partie (a0-complete, a1-part1 ... c1-part2), lit le <h1>
de l'édition en ligne de chaque module et du bilan (le fichier dont le rôle est
« web » dans manifeste.json, sinon le *_Online.html du dossier de la pièce).
Ce sont les fichiers vendus : les titres affichés sont ceux que l'acheteur reçoit.

Met à jour js/modules.js sans rien effacer : un produit absent du stock garde ses
titres actuels. Les résumés déjà présents sont gardés (le site ne les affiche pas).
"""
import datetime, glob, html, json, os, re, sys

if len(sys.argv) != 2 or not os.path.isdir(sys.argv[1]):
    sys.exit(__doc__)
stock = sys.argv[1]
cible = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'modules.js')

texte = open(cible, encoding='utf-8').read()
modules = json.loads(texte[texte.index('{'):texte.rindex(';')])

# Les produits d'une seule partie : a0-complete et les *-partN. Les packs (*-complete,
# complete-method) ne sont que des assemblages : le site lit les titres de leurs parties.
PARTIE = re.compile(r'^(a0-complete|[a-c][0-2]-part[12])$')
PIECE = re.compile(r'^(\d\d)-(Module-(\d+)|Level-Check)$')


def h1(chemin):
    page = open(chemin, encoding='utf-8', errors='replace').read()
    m = re.search(r'(?is)<h1[^>]*>(.*?)</h1>', page)
    return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', m.group(1)))).strip() if m else ''


def pages_web(dossier):
    """{pièce: chemin de l'édition en ligne}, d'après le manifeste s'il existe."""
    manifeste = os.path.join(dossier, 'manifeste.json')
    if os.path.exists(manifeste):
        m = json.load(open(manifeste, encoding='utf-8'))
        return {f['piece']: os.path.join(dossier, f['fichier']) for f in m['fichiers']
                if f.get('role') == 'web' and f.get('piece')}
    return {os.path.basename(os.path.dirname(p)): p
            for p in glob.glob(os.path.join(dossier, '*', '*_Online.html'))}


faits, alertes = [], []
for dossier in sorted(glob.glob(os.path.join(stock, '*'))):
    pid = os.path.basename(dossier)
    if not os.path.isdir(dossier) or not PARTIE.match(pid):
        continue
    ancien = modules.get(pid, {})
    resumes = {m['n']: m for m in ancien.get('modules', [])}
    liste, bilan = [], None
    for piece, chemin in sorted(pages_web(dossier).items()):
        p = PIECE.match(piece)
        if not p:
            continue
        titre = h1(chemin)
        if not titre:
            alertes.append('%s/%s : pas de <h1>' % (pid, piece))
            continue
        if p.group(3):
            n = int(p.group(3))
            garde = resumes.get(n, {})
            liste.append({'n': n, 'titre': titre, 'resume': garde.get('resume', ''),
                          'exercices': garde.get('exercices')})
        else:
            bilan = {'titre': titre, 'resume': (ancien.get('bilan') or {}).get('resume', '')}
    if len(liste) != 8:
        alertes.append('%s : %d modules trouvés au lieu de 8, produit non modifié' % (pid, len(liste)))
        continue
    if not bilan:
        alertes.append('%s : bilan introuvable' % pid)
    avant = [m['titre'] for m in ancien.get('modules', [])]
    modules[pid] = {'modules': liste, 'bilan': bilan or ancien.get('bilan')}
    faits.append('%s%s' % (pid, '' if avant == [m['titre'] for m in liste] else ' (titres changés)'))

if not faits:
    sys.exit('Aucun dossier de partie trouvé dans %s' % stock)

# L'ordre du catalogue : A0, A1 P1, A1 P2 ... C2 P2.
modules = dict(sorted(modules.items(), key=lambda kv: kv[0]))
with open(cible, 'w', encoding='utf-8') as f:
    f.write('// Généré par tools/importer_stock.py depuis le stock de la boutique (%s).\n'
            '// Ne pas modifier à la main : les titres viennent des fichiers vendus.\n' % datetime.datetime.now().isoformat(timespec='seconds'))
    f.write('const MODULES = ')
    json.dump(modules, f, ensure_ascii=False, indent=1)
    f.write(';\n')
print('%d produits lus dans le stock : %s' % (len(faits), ', '.join(faits)))
print('%d produits, %d modules dans js/modules.js' % (len(modules), sum(len(v['modules']) for v in modules.values())))
for a in alertes:
    print('ALERTE :', a)

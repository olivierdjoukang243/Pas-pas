# -*- coding: utf-8 -*-
"""
Importe dans le site les titres de modules exportés par l'atelier.

    python tools/importer_catalogue.py <chemin>/livraison/site/catalogue.json

Écrit js/modules.js : pour chaque produit, le titre et le résumé de chaque
module et de son bilan, tels que l'atelier les a lus dans les sources
(le <h1> et le paragraphe de couverture). Rien n'est saisi à la main ici :
pour changer un titre, on change la source, on relance l'export de
l'atelier, puis ce script.

Rien n'est effacé : un produit absent de l'export garde ses titres actuels
(si l'export de l'atelier oublie un niveau, utiliser tools/importer_stock.py).
"""
import json, os, sys

if len(sys.argv) != 2:
    sys.exit(__doc__)
cat = json.load(open(sys.argv[1], encoding='utf-8'))

out = {}
for p in cat['produits']:
    if 'modules' not in p:
        continue
    out[p['id']] = {
        'modules': [{'n': m['numero'], 'titre': m['titre'], 'resume': m['resume'],
                     'exercices': m['exercices']} for m in p['modules']],
        'bilan': {'titre': p['bilan']['titre'], 'resume': p['bilan']['resume']} if p.get('bilan') else None,
    }

cible = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'modules.js')
texte = open(cible, encoding='utf-8').read()
avant = json.loads(texte[texte.index('{'):texte.rindex(';')])
gardes = sorted(set(avant) - set(out))
out = dict(sorted({**avant, **out}.items()))
with open(cible, 'w', encoding='utf-8') as f:
    f.write('// Généré par tools/importer_catalogue.py depuis l\'export de l\'atelier (%s).\n'
            '// Ne pas modifier à la main : les titres viennent des sources.\n' % cat['genere'])
    f.write('const MODULES = ')
    json.dump(out, f, ensure_ascii=False, indent=1)
    f.write(';\n')
print('%d produits, %d modules -> js/modules.js' % (len(out), sum(len(v['modules']) for v in out.values())))
if gardes:
    print('ABSENTS DE L\'EXPORT, titres actuels gardés :', ', '.join(gardes))

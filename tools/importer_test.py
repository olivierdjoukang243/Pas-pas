# -*- coding: utf-8 -*-
"""
Importe dans le site la réserve du test de positionnement exportée par l'atelier.

    python tools/importer_test.py <chemin>/livraison/Pas-a-Pas-Level-Check.json

Écrit js/leveltest.js : pour chaque étape (A0, A1 Partie 1 … B1 Partie 2),
les compétences du bilan avec leur consigne et quelques items. Le site en
tire de nouvelles questions à chaque passage. Rien n'est saisi à la main ici :
les questions viennent des bilans, par positionnement.py.
"""
import json, os, sys

PAR_BLOC = 4          # un exemple et trois questions possibles par compétence

if len(sys.argv) != 2:
    sys.exit(__doc__)
d = json.load(open(sys.argv[1], encoding='utf-8'))

etapes = [{'name': e['nom'], 'product': e['produit'],
           'skills': [{'skill': b['competence'], 'instruction': b['consigne'],
                       'items': [[it['q'], it['r']] for it in b['items'][:PAR_BLOC]]}
                      for b in e['blocs']]}
          for e in d['etapes']]

cible = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'leveltest.js')
with open(cible, 'w', encoding='utf-8') as f:
    f.write('// Généré par tools/importer_test.py depuis l\'atelier (%s).\n'
            '// Ne pas modifier à la main : les questions viennent des bilans.\n' % d['genere'])
    f.write('const LEVEL_TEST = { pass: %d, steps: ' % d['seuil'])
    json.dump(etapes, f, ensure_ascii=False, separators=(',', ':'))
    f.write(' };\n')
print('%d étapes, %d compétences -> js/leveltest.js'
      % (len(etapes), sum(len(e['skills']) for e in etapes)))

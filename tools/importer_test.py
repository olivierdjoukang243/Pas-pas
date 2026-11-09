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

import re
# Une compétence écrite pour des anglophones (consigne ou items en anglais : traduction, indice
# « (maybe) »…) n'est pas posée sur le site français : repérée ici, à l'import, sur les mots
# anglais courants, jamais choisie à la main.
ANGLAIS_STRICT = re.compile(r"\bI\b")


def anglaise(b):
    texte = ' '.join([b['consigne']] + [it['q'] for it in b['items'][:PAR_BLOC]])
    return bool(re.search(r"\b(?:we|they|you|he|she|it|the|is|are|am|maybe|may|have|has|English|write|answer)\b",
                          texte, re.I) or ANGLAIS_STRICT.search(texte))


etapes = [{'name': e['nom'], 'product': e['produit'],
           'skills': [dict({'skill': b['competence'], 'instruction': b['consigne'],
                            'items': [[it['q'], it['r']] for it in b['items'][:PAR_BLOC]]},
                           **({'en': 1} if anglaise(b) else {}))
                      for b in e['blocs']]}
          for e in d['etapes']]
for e in etapes:
    n = sum(1 for k in e['skills'] if k.get('en'))
    if n:
        print('  %s : %d compétence(s) en anglais, écartée(s) du site français%s' % (
            e['name'], n, '' if n == len(e['skills']) else ' : ' + ', '.join(k['skill'] for k in e['skills'] if k.get('en'))))

cible = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'js', 'leveltest.js')
with open(cible, 'w', encoding='utf-8') as f:
    f.write('// Généré par tools/importer_test.py depuis l\'atelier (%s).\n'
            '// Ne pas modifier à la main : les questions viennent des bilans.\n' % d['genere'])
    f.write('const LEVEL_TEST = { pass: %d, steps: ' % d['seuil'])
    json.dump(etapes, f, ensure_ascii=False, separators=(',', ':'))
    # la compréhension orale et écrite, A1 à C2 (sans les transcriptions : elles donneraient
    # les réponses des écoutes) ; les pistes sont dans audio/levelcheck/
    comp = [{'level': n['niveau'], 'items': [
        {'id': i['id'], 'type': 'listen' if i['type'] == 'ecoute' else 'read',
         'audio': ('audio/levelcheck/' + i['audio']) if i['audio'] else '', 'seconds': i['secondes'],
         'title': i['titre'], 'text': i['texte'], 'question': i['question'], 'options': i['options'],
         'answer': i['juste'],
         # site français : la question et ses réponses en français, quand la source les donne
         **({'question_fr': i['question_fr'], 'options_fr': i['options_fr']} if i.get('question_fr') else {})}
        for i in n['items']]} for n in d.get('comprehension', [])]
    if comp:
        f.write(', comprehension: ')
        json.dump(comp, f, ensure_ascii=False, separators=(',', ':'))
    f.write(' };\n')
print('%d étapes, %d compétences, compréhension %s -> js/leveltest.js'
      % (len(etapes), sum(len(e['skills']) for e in etapes),
         ' '.join(n['niveau'] for n in d.get('comprehension', [])) or 'absente'))

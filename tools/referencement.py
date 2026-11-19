# -*- coding: utf-8 -*-
"""
Référencement Google du site (Olivier, 19/11/2026) : les données structurées (schema.org, JSON-LD)
de la page anglaise et de la page française, et la date du plan du site (sitemap.xml).

    python tools/referencement.py            # écrit les blocs entre les repères, met à jour sitemap.xml

Rien n'est saisi à la main : les cours, les sujets d'examen, les cours en direct et leurs prix
viennent de js/products.js (lu par node), comme sur le site. Un produit pas encore en vente
(ready: false) n'est pas annoncé à Google. Les blocs vont entre
<!-- referencement:debut --> et <!-- referencement:fin --> dans index.html et fr/index.html.
"""
import datetime, json, os, re, subprocess, sys

ICI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://pasapasfrench.com'
DEBUT, FIN = '<!-- referencement:debut -->', '<!-- referencement:fin -->'

LIRE = r"""
global.document={documentElement:{lang:'en'},addEventListener(){},querySelectorAll(){return []},querySelector(){return null}};
global.location={search:''};global.localStorage={getItem(){return null}};
eval(require('fs').readFileSync(process.argv[1],'utf8')+';global.X={P:PRODUCTS,E:EXAM_PACKS,EF:EXAM_FR,L:LIVE};');
process.stdout.write(JSON.stringify(X));
"""


def catalogue():
    r = subprocess.run(['node', '-e', LIRE, os.path.join(ICI, 'js', 'products.js')],
                       capture_output=True, text=True, encoding='utf-8')
    if r.returncode:
        sys.exit('Lecture de js/products.js impossible :\n' + r.stderr[-800:])
    return json.loads(r.stdout)


ORGA = {'@type': 'EducationalOrganization', '@id': SITE + '/#organisation', 'name': 'Pas à Pas FRENCH',
        'url': SITE + '/', 'logo': SITE + '/img/icone-512.png',
        'founder': {'@type': 'Person', '@id': SITE + '/#olivier', 'name': 'Olivier Djoukang'}}


def offres(p):
    return [{'@type': 'Offer', 'price': str(p['usd']), 'priceCurrency': 'USD', 'category': 'Paid',
             'availability': 'https://schema.org/InStock', 'url': SITE + '/'},
            {'@type': 'Offer', 'price': str(p['xaf']), 'priceCurrency': 'XAF', 'category': 'Paid',
             'availability': 'https://schema.org/InStock', 'url': SITE + '/'}]


def cours(p, nom, desc, langue, page):
    return {'@type': 'Course', 'name': nom, 'description': desc, 'inLanguage': langue,
            'provider': {'@id': SITE + '/#organisation'}, 'offers': [dict(o, url=page) for o in offres(p)],
            'hasCourseInstance': {'@type': 'CourseInstance', 'courseMode': 'Online'}}


def bloc(graphe):
    return ('%s\n  <script type="application/ld+json">\n  %s\n  </script>\n  %s'
            % (DEBUT, json.dumps({'@context': 'https://schema.org', '@graph': graphe},
                                 ensure_ascii=False, separators=(',', ':')), FIN))


def en(c):
    page = SITE + '/'
    vendus = [p for p in c['P'] if p.get('ready') is not False]
    examens = [p for p in c['E'] if p.get('ready') is not False]
    return [ORGA, {'@type': 'WebSite', '@id': page + '#site', 'url': page, 'name': 'Pas à Pas FRENCH',
                   'inLanguage': 'en', 'publisher': {'@id': SITE + '/#organisation'}}] + [
        cours(p, p['name'], p.get('desc') or p.get('contents', ''), 'en', page) for p in vendus + examens]


def fr(c):
    page = SITE + '/fr/'
    examens = [p for p in c['E'] if p.get('ready') is not False]
    direct = c['L']
    g = [ORGA, {'@type': 'WebSite', '@id': page + '#site', 'url': page, 'name': 'Pas à Pas FRENCH',
                'inLanguage': 'fr', 'publisher': {'@id': SITE + '/#organisation'}}]
    for p in examens:
        t = c['EF'].get(p['id'], {})
        g.append(cours(p, t.get('name', p['name']), t.get('desc', p.get('desc', '')), 'fr', page))
    for p in direct:
        t = p.get('fr', {})
        g.append(cours(p, t.get('name', p['name']), t.get('desc', p.get('desc', '')), 'fr', page))
    return g


def poser(chemin, contenu):
    h = open(chemin, encoding='utf-8').read()
    if DEBUT in h:
        h = re.sub(re.escape(DEBUT) + '.*?' + re.escape(FIN), lambda m: contenu, h, count=1, flags=re.S)
    else:
        # première fois : l'ancien bloc JSON-LD écrit à la main est remplacé, sinon le bloc va avant </head>
        ancien = re.search(r'\s*<script type="application/ld\+json">.*?</script>', h, re.S)
        h = (h[:ancien.start()] + '\n  ' + contenu + h[ancien.end():]) if ancien else \
            h.replace('</head>', '  ' + contenu + '\n</head>', 1)
    open(chemin, 'w', encoding='utf-8').write(h)


def main():
    c = catalogue()
    poser(os.path.join(ICI, 'index.html'), bloc(en(c)))
    poser(os.path.join(ICI, 'fr', 'index.html'), bloc(fr(c)))
    plan = os.path.join(ICI, 'sitemap.xml')
    s = open(plan, encoding='utf-8').read()
    jour = datetime.date.today().isoformat()
    s = re.sub(r'\s*<lastmod>[^<]*</lastmod>', '', s)
    s = re.sub(r'(</loc>)', r'\1\n    <lastmod>%s</lastmod>' % jour, s)
    open(plan, 'w', encoding='utf-8').write(s)
    print('Données structurées : %d éléments (anglais), %d (français) ; sitemap.xml daté du %s.'
          % (len(en(c)), len(fr(c)), jour))


if __name__ == '__main__':
    main()

# Algoritmus

Az algoritmus lényege az egyszerűen összepcsolt tulajdonság fenntartása, azzal, hogy csak olyan sarkokban állnak majd meg robotok ahol garantáltan nem váják több részre a teret.

![Figure 5](./images/fig5.png)

Egy ilyen módszer a környezet aktívan módosítja ezzel indirekt információt áttadval a robotok között.

## FCDFS

Az algoritmus menete a következő minden robotra végrehajtva:

- Választunk egy irányt (a továbbiakban elsődleges irány, a másodlagos irány mindig ehhez képest 90 fok).
- A következők közül csak az egyiket hajtjuk végre, az első amely feltétele igaz a felsorolásban
  - Ha az elsődleges irány szabad, akkor arra megyünk
  - Ha a másodlagos irány szabad, akkor arra megyünk
  - Ha legalább 3 körölöttünk lévő cella foglalt (megállt robot, vagy fal által), akkor megáll a robot
    - Ezen a ponton mivel az elsődleges és a másodlagos irányba nem tudunk menni így legalább 2 cella foglalt a 3 ből
  - Ha az két lépéssel ez előtt a [diagonális elemen](#diagonális-elem) álltunk, vagy a diagonális elem jelenleg szabad, akkor jelenleg egy olyan sarokban állunk, ahol megállhatunk
    - Ezen a ponton mivel eddig legalább 2 és kevesebb mint 3 cella szabad körölüttünk így, tudjuk hogy pontosan 2 irány szabad
  - Különben egy kanyarban állunk, ahol nem állhatunk meg, keressünk egy olyan irányt amerre áttállítjuk az elsődleges irányt és lépünk, ez az irány nem lehet ugyan az mint amelyik irányból ide léptünk
    - A kanyarba beleléptünk az egyik irányból ami szabad, és továbbmegyünk a másik irányba ami szabad

### Lehetséges sarkok

![Figure 2](./images/fig2.png)

## Megjegyzések

### Diagonális elem

![Figure 3](./images/fig3.png)

Egy sarokban állva (ahol két diagonálisan egymás melleti elem blokkol) a diagonális elem az a sarok pontjaitól 3 manhattan távolságra lévő elem ami a sarokban állótól 2 manhattan távolságra van.

**Formálisan:** Legyen h = (hx, hy) egy robot pozíciója, és $p_i = (px_i, py_i), i \in \{0, 1, 2, 3, 4\}$ a h -val szomszédos blokkoló elemek halmaza és hn az ilyen elemek száma.

$$diag(h) = \sum\_{i = 1}^{hn} (hx - px_i, hy - py_i)$$

### A kanyarok sarokpontjai elvágó pontok

A pályára mint gráfra tekintve, ahol a szabad cellák között a manhattan távolság = 1 alapján húzunk be éleket, így eredetileg egy egyszerűen összefüggő tér egy összefüggő gráf

**A bizonyítás vázlata:**

Ha feltesszük hogy nem elvágópont egy kanyar, akkor létezik két út is a sarok melletti pontokhoz, ahonnan kapcsolódhatnak a tér többi részéhez, hiszen az indirekt feltételünk szereint sarok pont nem elvágópont, így ha az levágjuk még mindig összefüggő marad a gráf. Igy viszont a kanyar két ága összekapcsolódik valahol máshol is mint a sarok elemen, ezzel körbevével vagy a diagonális elemet vagy a diagonálissal szembeni sarkot.
Ez viszont ellentmond az eredeti feltételünknek hogy a tér egyszerűen összekapcsolt, hiszen akkor a falakból és megállt robotokból álló rész nem alkot összefüggő gráfot, hiszen a diagonális elemet nem lehet összekötni a sarok elemekkel, ahogy ez látszik az illusztrációban is.

A formális bizonyítás olvasható az eredei cikkben [@amir2024time].

![Figure 6](./images/fig6.png)

### Optimalitás

Az algoritmus során minden robot optimális úton halad a végcéljához, és minden körben lép minden robot, ebből következően az algoritmus $T_{max}, T_{total}$ optimális, valamint mivel a robot minden körben lép majd egy kör alatt megáll, így maximális és összes energia optimális is, valamint teljesítési idő optimális is.

A teljes bizonyítás az eredeti cikkben olvasható [@amir2024time].

## AFCDFS

Az [fcdfs](#fcdfs) algoritmus asyncorn változata, ahol a valóságot jobban közelíttő módon, a robotok nem egyszerre lépnek, hanem egymástól "függetlenül" tudnak lépni. A szimulációban ez az jelenti, hogy egy körben egy adott robotnak p valószínűséggel tud majd lépni.

A szinkronizált lépések hordoztak magukkal információt, amit itt nem tudunk kihasználni, ezért itt 1 bit kommunikációra szükségünk van körönként, ez segítteni fog megkülönböztetni a megállt és a még aktív robotokat.

Az algoritmus menete ugyan az mint a [szinkron esetben](#algoritmus), de itt nem csak azt vizsgáljuk majd hogy egy mező foglalt e, hanem azt is hogy éppen aktív robot foglalja e a mezőt, ez nem fordulhatott elő az alapfeladatban, hiszen ott mindenki egyszerre lét, 2 körönként jelennek meg új robotok, és minden robot optimális úton halad a végcélja felé. Itt viszont habár továbbra is optimális úton haladnak a robotok a végcéljukhoz, de így is kerülhetnek közvetlen egymás mellé, ebben az esetben a hátrább lévő robot abban a körben nem csinál semmit, várakozik ameddig az előtte lévő robot elmozdul, vagy letelepedig és inaktívvá válik.

### Optimalitás

A [afcdfs](#afcdfs) algoritmus során minden robot optimális úton halad a végcéljához, ugyan azon az úton, mint ahol a [fcdfs](#fcdfs) algoritmus is haladna, így az algoritmus $T_{max}, T_{total}$ optimális.

Az energia és idő optimalitásra, azt tudjuk mondani hogy asszimptotikusan optimális, azaz ahogy a járható cellák száma közelítti a végtelent, úgy a totális és maximális energia felhasználás tart az optimális értékhez, és a teljesítési idő asszimptotikusan optimális.

**Formálisan:** Legyen $\alpha = \frac{1}{2}(1 - \sqrt{1 - p})$, ahol p az AFCDFS paramétere, ekkor

$$M \leq \left(\frac{1}{\alpha} + o(1)\right) n$$
$$E_{max} \leq 2\left(1 + \alpha + o(1)\right) \max_{v \in R} dist(s, v)$$

Feltételek $n \to \infty$ esetén nagy valószínűséggel teljesülnek, ahogy $n \to \infty$ úgy a valószínűség tart 1-hez.

# Eredmények és összehasonlítás

Több példára az FCDFS és AFCDFS algoritmusokat futtatták az eredeti cikkben [@amir2024time], valamint ezt mi is megerősítettük, a [saját szimulációinkkal](https://kristofy.github.io/uniform-dispersion-problem/simulation).
Az eredeti cikkben a mérésekhez még hozzávették az eddigi ismert megoldásokat Hsiang et al DFLF és BFLF algoritmusait [@hsiang2004]

Az összehasonlíttásokat a két már látott példára, a Table II. táblázat foglalja össze, ezt a szimulációt mi is [lefuttathatjuk](https://kristofy.github.io/uniform-dispersion-problem/simulation).

![Table II](./images/table2.png)

Az algoritmus skáláhatóságának vizsgálására a Figure 9. kép szolgál

![Figure 9](./images/fig9.png)

Itt megfigyelhegjuk hogy az FCDFS algortitmus mindig a legjobb, minden metrika alapján, hiszen mind az 5 kritérium alapján optimális.

Az asszinkron algortitmus (AFCDFS) pedig jobban teljesítt az energia optimalitás szempontjából mint az eddig ismert általános megoldások, a DFLF és BFLF algoritmusok, erre az eredményre számítottunk, hiszen az általános esetben az energia optimalitás megoldása nem oldható meg[^1].

[^1]: Az energia optimalitás megoldása általános esetben nem lehetséges konstans látótávolság melett.

# References

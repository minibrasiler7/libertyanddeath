// Palette maths — palette flottante de symboles mathématiques pour macOS
// Un seul fichier Swift. Compilation : double-clic sur Compiler.command (voir README.md)
//
// Principe : une petite fenêtre toujours au premier plan. Un clic sur un bouton
// « tape » le symbole dans l'application active (Word, Pages, Notes…) grâce à
// l'accessibilité macOS. Certains boutons ouvrent un petit formulaire dans la
// palette (fraction, puissance, notations de géométrie) : l'élève remplit,
// valide, et le résultat rendu s'écrit dans le document.

import Cocoa
import SwiftUI

// MARK: - Modèle

enum Mode: String, CaseIterable, Identifiable {
    case universel = "Universel"
    case word = "Word"
    case pages = "Pages"
    var id: String { rawValue }
}

struct KeyPress {
    let code: CGKeyCode
    let flags: CGEventFlags
    let char: String?
}

struct Insertion {
    var text: String
    var left: Int = 0                 // flèches gauche après le texte (placer le curseur)
    var preKeys: [KeyPress] = []      // raccourcis envoyés avant le texte (ouvrir une équation)
    var postKeys: [KeyPress] = []     // touches envoyées après le texte (valider / sortir de l'équation)
    var postText: String = ""         // texte tapé tout à la fin (ex. une espace après l'équation)
    var note: String? = nil           // conseil affiché en bas de la palette
}

struct FormField {
    let label: String
    let initial: String
}

struct FormSpec {
    let title: String
    let fields: [FormField]
    let build: ([String], Mode) -> Insertion
}

struct Item: Identifiable {
    let id = UUID()
    let label: String
    let help: String
    var universel: Insertion = Insertion(text: "")
    var word: Insertion? = nil
    var pages: Insertion? = nil
    var form: FormSpec? = nil

    func insertion(for mode: Mode) -> Insertion {
        switch mode {
        case .universel: return universel
        case .word: return word ?? universel
        case .pages: return pages ?? universel
        }
    }
}

struct PaletteSection: Identifiable {
    let id = UUID()
    let title: String
    let items: [Item]
}

struct Theme: Identifiable {
    let id = UUID()
    let name: String
    let words: [String]
}

// MARK: - Touches

let keyReturn: CGKeyCode = 36
let keyLeft: CGKeyCode = 123
let keyRight: CGKeyCode = 124
let keyV: CGKeyCode = 9
let keyE: CGKeyCode = 14
let keyEqual: CGKeyCode = 24

let pressReturn = KeyPress(code: keyReturn, flags: [], char: nil)
let pressRight = KeyPress(code: keyRight, flags: [], char: nil)
let pressWordEquation = KeyPress(code: keyEqual, flags: .maskControl, char: "=")
let pressPagesEquation = KeyPress(code: keyE, flags: [.maskCommand, .maskAlternate], char: nil)

// MARK: - Fabrique d'insertions

private func u(_ text: String, left: Int = 0, note: String? = nil) -> Insertion {
    Insertion(text: text, left: left, note: note)
}

/// Équation Word : ouvre l'éditeur (⌃=), tape le format linéaire, Espace construit
/// la formule, flèche droite ressort de l'équation.
private func wordEq(_ linear: String, note: String = "Équation insérée dans Word.") -> Insertion {
    // Un accent (\hat, \vec) est d'abord converti par la correction automatique (1re espace),
    // puis Word construit l'équation (2e espace).
    let endsWithAccent = linear.hasSuffix("\\hat") || linear.hasSuffix("\\vec")
    let trigger = endsWithAccent ? "  " : " "
    return Insertion(text: linear + trigger, preKeys: [pressWordEquation], postKeys: [pressRight], postText: " ", note: note)
}

/// Équation Pages : ouvre l'éditeur (⌥⌘E), tape le LaTeX, Retour insère.
private func pagesEq(_ latex: String, note: String = "Équation insérée dans Pages.") -> Insertion {
    Insertion(text: latex, preKeys: [pressPagesEquation], postKeys: [pressReturn], postText: " ", note: note)
}

private let superscripts: [Character: String] = [
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
    "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ", "f": "ᶠ", "g": "ᵍ", "h": "ʰ", "i": "ⁱ", "j": "ʲ",
    "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "n": "ⁿ", "o": "ᵒ", "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ",
    "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ",
]
private let subscripts: [Character: String] = [
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "+": "₊", "-": "₋", "−": "₋", "=": "₌", "(": "₍", ")": "₎",
]

private func sup(_ s: String) -> String? {
    var out = ""
    for c in s {
        guard let m = superscripts[c] else { return nil }
        out += m
    }
    return out.isEmpty ? nil : out
}

private func sub(_ s: String) -> String? {
    var out = ""
    for c in s {
        guard let m = subscripts[c] else { return nil }
        out += m
    }
    return out.isEmpty ? nil : out
}

private func clean(_ s: String) -> String {
    s.trimmingCharacters(in: .whitespaces)
}

func fractionInsertion(_ num: String, _ den: String, _ mode: Mode) -> Insertion {
    let n = clean(num)
    let d = clean(den)
    switch mode {
    case .universel:
        if let a = sup(n), let b = sub(d) {
            return u(a + "⁄" + b, note: "Fraction insérée : \(a)⁄\(b)")
        }
        return u("\(n)/\(d)", note: "Fraction insérée en écriture simple.")
    case .word:
        return wordEq("(\(n))/(\(d))", note: "Fraction insérée dans Word. Si rien n'apparaît : menu Insertion → Équation, puis réessaie.")
    case .pages:
        return pagesEq("\\frac{\(n)}{\(d)}", note: "Fraction insérée dans Pages.")
    }
}

func powerInsertion(_ exp: String, _ mode: Mode) -> Insertion {
    let e = clean(exp)
    if let s = sup(e) {
        return u(s, note: "Exposant inséré : \(s)")
    }
    switch mode {
    case .word: return wordEq("^(\(e))", note: "Exposant inséré dans une équation Word.")
    case .pages: return pagesEq("^{\(e)}", note: "Exposant inséré dans une équation Pages.")
    case .universel: return u("^(\(e))", note: "Exposant écrit avec ^ (caractère non disponible en exposant).")
    }
}

func angleInsertion(_ letters: String, _ mode: Mode) -> Insertion {
    let l = clean(letters)
    switch mode {
    case .universel: return u("∠\(l)", note: "Angle ∠\(l). Le chapeau sur les trois lettres n'existe qu'en mode Word ou Pages.")
    case .word: return wordEq("(\(l))\\hat", note: "Angle \(l) avec chapeau, dans Word.")
    case .pages: return pagesEq("\\widehat{\(l)}", note: "Angle \(l) avec chapeau, dans Pages.")
    }
}

func vectorInsertion(_ letters: String, _ mode: Mode) -> Insertion {
    let l = clean(letters)
    switch mode {
    case .universel:
        let arrowed = l.map { String($0) + "\u{20D7}" }.joined()
        return u(arrowed, note: "Vecteur \(l).")
    case .word: return wordEq("(\(l))\\vec", note: "Vecteur \(l), dans Word.")
    case .pages: return pagesEq("\\vec{\(l)}", note: "Vecteur \(l), dans Pages.")
    }
}

func sqrtInsertion(_ inside: String, _ mode: Mode) -> Insertion {
    let s = clean(inside)
    switch mode {
    case .universel: return u("√\(s)")
    case .word: return wordEq("\\sqrt(\(s))")
    case .pages: return pagesEq("\\sqrt{\(s)}")
    }
}

func cbrtInsertion(_ inside: String, _ mode: Mode) -> Insertion {
    let s = clean(inside)
    switch mode {
    case .universel: return u("∛\(s)")
    case .word: return wordEq("\\cbrt(\(s))")
    case .pages: return pagesEq("\\sqrt[3]{\(s)}")
    }
}

func indexInsertion(_ idx: String, _ mode: Mode) -> Insertion {
    let s = clean(idx)
    if let t = sub(s) {
        return u(t, note: "Indice inséré : \(t)")
    }
    return u("_\(s)")
}

private func fractionItem(_ label: String, _ n: String, _ d: String) -> Item {
    Item(label: label, help: "Fraction \(n)/\(d)",
         universel: fractionInsertion(n, d, .universel),
         word: fractionInsertion(n, d, .word),
         pages: fractionInsertion(n, d, .pages))
}

private func formItem(_ label: String, _ help: String, title: String, fieldLabel: String, initial: String,
                      _ build: @escaping (String, Mode) -> Insertion) -> Item {
    let spec = FormSpec(title: title, fields: [FormField(label: fieldLabel, initial: initial)]) { values, mode in
        build(values.first ?? initial, mode)
    }
    return Item(label: label, help: help, form: spec)
}

// MARK: - Catalogue des boutons

enum Catalogue {
    static let sections: [PaletteSection] = [
        PaletteSection(title: "Opérations", items: operations),
        PaletteSection(title: "Fractions et puissances", items: fractions),
        PaletteSection(title: "Géométrie", items: geometrie),
        PaletteSection(title: "Ensembles", items: ensembles),
        PaletteSection(title: "Raisonnement", items: raisonnement),
    ]

    static let operations: [Item] = [
        Item(label: "+", help: "Plus", universel: u(" + ")),
        Item(label: "−", help: "Moins", universel: u(" − ")),
        Item(label: "×", help: "Multiplication", universel: u(" × ")),
        Item(label: "÷", help: "Division", universel: u(" ÷ ")),
        Item(label: "=", help: "Égal", universel: u(" = ")),
        Item(label: "( )", help: "Parenthèses — le curseur est placé au milieu", universel: u("()", left: 1)),
        Item(label: "·", help: "Point de multiplication", universel: u(" · ")),
        Item(label: "±", help: "Plus ou moins", universel: u("±")),
        Item(label: "≠", help: "Différent de", universel: u(" ≠ ")),
        Item(label: "<", help: "Inférieur à", universel: u(" < ")),
        Item(label: ">", help: "Supérieur à", universel: u(" > ")),
        Item(label: "≤", help: "Inférieur ou égal", universel: u(" ≤ ")),
        Item(label: "≥", help: "Supérieur ou égal", universel: u(" ≥ ")),
        Item(label: "≈", help: "Environ égal", universel: u(" ≈ ")),
        Item(label: "%", help: "Pour cent", universel: u("%")),
        Item(label: "cm²", help: "Centimètres carrés", universel: u("cm²")),
        Item(label: "cm³", help: "Centimètres cubes", universel: u("cm³")),
        Item(label: "π", help: "Pi", universel: u("π")),
        Item(label: "∞", help: "Infini", universel: u("∞")),
    ]

    static let fractions: [Item] = [
        Item(label: "a/b", help: "Fraction : tu entres le haut et le bas, puis tu valides",
             form: FormSpec(title: "Fraction",
                            fields: [FormField(label: "Numérateur (en haut)", initial: ""),
                                     FormField(label: "Dénominateur (en bas)", initial: "")]) { values, mode in
                 fractionInsertion(values[0], values[1], mode)
             }),
        fractionItem("½", "1", "2"),
        fractionItem("⅓", "1", "3"),
        fractionItem("¼", "1", "4"),
        fractionItem("⅕", "1", "5"),
        fractionItem("¾", "3", "4"),
        formItem("xⁿ", "Puissance : tu entres l'exposant, il s'écrit en petit en haut",
                 title: "Puissance (exposant)", fieldLabel: "Exposant", initial: "", powerInsertion),
        Item(label: "x²", help: "Au carré", universel: u("²")),
        Item(label: "x³", help: "Au cube", universel: u("³")),
        formItem("x₁", "Indice : tu entres le petit nombre en bas",
                 title: "Indice", fieldLabel: "Indice", initial: "", indexInsertion),
        formItem("√", "Racine carrée : tu entres ce qui est sous la racine",
                 title: "Racine carrée", fieldLabel: "Sous la racine", initial: "", sqrtInsertion),
        formItem("∛", "Racine cubique : tu entres ce qui est sous la racine",
                 title: "Racine cubique", fieldLabel: "Sous la racine", initial: "", cbrtInsertion),
    ]

    static let geometrie: [Item] = [
        formItem("[AB]", "Segment — tu entres les lettres", title: "Segment [AB]", fieldLabel: "Lettres", initial: "AB") { l, _ in
            u("[\(clean(l))]")
        },
        formItem("(AB)", "Droite — tu entres les lettres", title: "Droite (AB)", fieldLabel: "Lettres", initial: "AB") { l, _ in
            u("(\(clean(l)))")
        },
        formItem("[AB)", "Demi-droite — tu entres les lettres", title: "Demi-droite [AB)", fieldLabel: "Lettres", initial: "AB") { l, _ in
            u("[\(clean(l)))")
        },
        formItem("ÂBC", "Angle avec chapeau — tu entres les trois lettres",
                 title: "Angle", fieldLabel: "Lettres (sommet au milieu)", initial: "ABC", angleInsertion),
        formItem("AB⃗", "Vecteur — tu entres les lettres",
                 title: "Vecteur", fieldLabel: "Lettres", initial: "AB", vectorInsertion),
        Item(label: "//", help: "Parallèle", universel: u(" // ")),
        Item(label: "∥", help: "Parallèle (symbole)", universel: u(" ∥ ")),
        Item(label: "⊥", help: "Perpendiculaire", universel: u(" ⊥ ")),
        Item(label: "∠", help: "Symbole angle", universel: u("∠")),
        Item(label: "△", help: "Triangle", universel: u("△")),
        Item(label: "°", help: "Degré", universel: u("°")),
        Item(label: "≅", help: "Isométrique", universel: u(" ≅ ")),
        Item(label: "∼", help: "Semblable", universel: u(" ∼ ")),
        Item(label: "α", help: "Alpha", universel: u("α")),
        Item(label: "β", help: "Bêta", universel: u("β")),
        Item(label: "γ", help: "Gamma", universel: u("γ")),
        Item(label: "θ", help: "Thêta", universel: u("θ")),
        Item(label: "Δ", help: "Delta", universel: u("Δ")),
    ]

    static let ensembles: [Item] = [
        Item(label: "ℕ", help: "Nombres naturels", universel: u("ℕ")),
        Item(label: "ℤ", help: "Nombres entiers relatifs", universel: u("ℤ")),
        Item(label: "ℚ", help: "Nombres rationnels", universel: u("ℚ")),
        Item(label: "ℝ", help: "Nombres réels", universel: u("ℝ")),
        Item(label: "∈", help: "Appartient à", universel: u(" ∈ ")),
        Item(label: "∉", help: "N'appartient pas à", universel: u(" ∉ ")),
    ]

    static let raisonnement: [Item] = [
        Item(label: "⟹", help: "Implique", universel: u(" ⟹ ")),
        Item(label: "⟺", help: "Équivaut à", universel: u(" ⟺ ")),
        Item(label: "Donc", help: "Donc", universel: u("Donc ")),
        Item(label: "Car", help: "Car", universel: u("car ")),
        Item(label: "D'où", help: "D'où", universel: u("D'où ")),
        Item(label: "Hyp.", help: "Hypothèse :", universel: u("Hypothèse : ")),
        Item(label: "Calcul", help: "Calcul :", universel: u("Calcul : ")),
        Item(label: "Concl.", help: "Conclusion :", universel: u("Conclusion : ")),
        Item(label: "Plan", help: "Structure complète : Phrase / Calcul / Réponse",
             universel: u("Phrase : \nCalcul : \nRéponse : ")),
        Item(label: "Réponse", help: "Réponse :", universel: u("Réponse : ")),
    ]

    // Lexique par chapitre (découpage 9VP 2026-2027)
    static let themes: [Theme] = [
        Theme(name: "Nombres naturels et décimaux", words: [
            "multiple", "diviseur", "divisible", "critère de divisibilité", "nombre premier",
            "ppmc", "pgdc", "produit de facteurs", "décomposition", "terme",
            "facteur", "produit", "somme", "différence", "quotient",
            "reste", "priorité des opérations", "parenthèses", "estimation", "arrondi",
        ]),
        Theme(name: "Figures géométriques planes", words: [
            "triangle", "quadrilatère", "cercle", "angle aigu", "angle obtus",
            "angle droit", "angle plat", "angle rentrant", "sommet", "côté",
            "diagonale", "axe de symétrie", "parallèles", "perpendiculaires", "hauteur",
            "médiatrice", "bissectrice", "médiane", "cercle inscrit", "cercle circonscrit",
        ]),
        Theme(name: "Nombres relatifs", words: [
            "nombre relatif", "positif", "négatif", "opposé", "signe",
            "droite numérique", "comparaison", "encadrement", "approximation", "inférieur à",
            "supérieur à", "ordre croissant", "ordre décroissant", "somme", "différence",
            "produit", "quotient", "règle des signes", "valeur", "zéro",
        ]),
        Theme(name: "Transformations géométriques", words: [
            "isométrie", "translation", "symétrie axiale", "rotation", "symétrie centrale",
            "vecteur de translation", "axe de symétrie", "centre de rotation", "centre de symétrie", "image",
            "figure initiale", "conservation", "frise", "pavage", "agrandissement",
            "réduction", "proportionnalité", "repère", "coordonnées", "angle de rotation",
        ]),
        Theme(name: "Lignes et surfaces", words: [
            "périmètre", "aire", "longueur", "largeur", "base",
            "hauteur", "unité", "carré", "rectangle", "triangle",
            "parallélogramme", "losange", "trapèze", "polygone", "décomposition",
            "mesure", "estimation", "formule", "cm²", "m²",
        ]),
        Theme(name: "Nombres rationnels", words: [
            "fraction", "numérateur", "dénominateur", "simplification", "amplification",
            "fraction irréductible", "dénominateur commun", "nombre décimal", "pourcentage", "puissance",
            "exposant", "base", "écriture décimale", "écriture fractionnaire", "ordre de grandeur",
            "encadrement", "droite numérique", "ensemble de nombres", "partie entière", "arrondi",
        ]),
        Theme(name: "Fonctions et diagrammes", words: [
            "fonction", "variable", "tableau de valeurs", "graphique", "opérateur",
            "machine", "proportionnalité", "facteur de proportionnalité", "grandeur", "axe",
            "origine", "point", "coordonnées", "diagramme cartésien", "diagramme en colonnes",
            "lecture", "interprétation", "prix", "échelle", "relation",
        ]),
        Theme(name: "Représentations de solides", words: [
            "solide", "cube", "parallélépipède rectangle", "prisme droit", "cylindre",
            "pyramide", "cône", "sphère", "face", "sommet",
            "arête", "polyèdre", "développement", "perspective", "base",
            "hauteur", "face latérale", "arête cachée", "vue de face", "vue de dessus",
        ]),
        Theme(name: "Solides et diverses mesures", words: [
            "volume", "aire totale", "aire latérale", "capacité", "litre",
            "cm³", "dm³", "m³", "masse", "gramme",
            "kilogramme", "temps", "seconde", "minute", "heure",
            "conversion", "unité", "estimation", "formule", "dimension",
        ]),
        Theme(name: "Calcul littéral", words: [
            "expression littérale", "variable", "inconnue", "coefficient", "terme",
            "monôme", "valeur numérique", "substitution", "réduire", "simplifier",
            "convention d'écriture", "produit", "somme", "facteur", "développer",
            "égalité", "formule", "périmètre", "aire", "lettre",
        ]),
    ]
}

func newEquation(for mode: Mode) -> Insertion {
    switch mode {
    case .word:
        return Insertion(text: "", preKeys: [pressWordEquation],
                         note: "Nouvelle équation Word. Si rien ne se passe : menu Insertion → Équation.")
    case .pages:
        return Insertion(text: "", preKeys: [pressPagesEquation],
                         note: "Nouvelle équation Pages. Tape la formule, puis « Insérer ».")
    case .universel:
        return Insertion(text: "")
    }
}

// MARK: - Frappe simulée

enum Typist {
    static var useClipboard = false
    /// Appelé sur le thread principal juste avant de taper : rend le clavier au document.
    static var beforeTyping: (() -> Void)?
    private static let queue = DispatchQueue(label: "palette.typist")

    /// Renvoie un message si l'insertion ne peut pas fonctionner, sinon nil.
    static func problem() -> String? {
        if !AXIsProcessTrusted() {
            return "⚠️ Autorisation d'accessibilité manquante. Réglages Système → Confidentialité et sécurité → Accessibilité : retire « Palette maths » de la liste (bouton –) puis ajoute-la à nouveau (bouton +), puis quitte et relance la palette."
        }
        if let front = NSWorkspace.shared.frontmostApplication,
           front.processIdentifier == ProcessInfo.processInfo.processIdentifier {
            return "Clique d'abord dans ton document (Word, Pages…), puis sur un symbole."
        }
        return nil
    }

    static func perform(_ ins: Insertion) {
        queue.async {
            DispatchQueue.main.sync { beforeTyping?() }
            usleep(250_000)
            for k in ins.preKeys {
                press(k)
                usleep(120_000)
            }
            if !ins.preKeys.isEmpty { usleep(1_200_000) }   // laisser Word/Pages ouvrir l'éditeur d'équations
            if !ins.text.isEmpty {
                if useClipboard { paste(ins.text) } else { typeText(ins.text) }
            }
            if ins.left > 0 {
                usleep(120_000)
                for _ in 0..<ins.left {
                    press(KeyPress(code: keyLeft, flags: [], char: nil))
                    usleep(20_000)
                }
            }
            if !ins.postKeys.isEmpty {
                usleep(300_000)
                for k in ins.postKeys {
                    press(k)
                    usleep(150_000)
                }
            }
            if !ins.postText.isEmpty {
                usleep(150_000)
                typeText(ins.postText)
            }
        }
    }

    private static func post(_ src: CGEventSource?, _ code: CGKeyCode, down: Bool, flags: CGEventFlags, char: String?) {
        guard let ev = CGEvent(keyboardEventSource: src, virtualKey: code, keyDown: down) else { return }
        ev.flags = flags
        if let c = char {
            var units = Array(c.utf16)
            ev.keyboardSetUnicodeString(stringLength: units.count, unicodeString: &units)
        }
        ev.post(tap: .cghidEventTap)
    }

    /// Appuie sur une touche, en enfonçant puis relâchant explicitement les modificateurs
    /// (sinon macOS peut croire que Contrôle ou Commande restent enfoncés).
    static func press(_ k: KeyPress) {
        let src = CGEventSource(stateID: .combinedSessionState)
        let modifiers: [(CGEventFlags, CGKeyCode)] = [
            (.maskControl, 59), (.maskAlternate, 58), (.maskShift, 56), (.maskCommand, 55),
        ]
        let active = modifiers.filter { k.flags.contains($0.0) }
        var acc: CGEventFlags = []
        for (flag, code) in active {
            acc.insert(flag)
            post(src, code, down: true, flags: acc, char: nil)
            usleep(20_000)
        }
        post(src, k.code, down: true, flags: acc, char: k.char)
        usleep(10_000)
        post(src, k.code, down: false, flags: acc, char: k.char)
        for (flag, code) in active.reversed() {
            acc.remove(flag)
            usleep(20_000)
            post(src, code, down: false, flags: acc, char: nil)
        }
    }

    /// Tape le texte caractère par caractère (fonctionne dans la plupart des applications).
    static func typeText(_ text: String) {
        let src = CGEventSource(stateID: .combinedSessionState)
        let lines = text.components(separatedBy: "\n")
        for (i, line) in lines.enumerated() {
            for scalar in line.unicodeScalars {
                var units = Array(String(scalar).utf16)
                guard let down = CGEvent(keyboardEventSource: src, virtualKey: 0, keyDown: true),
                      let up = CGEvent(keyboardEventSource: src, virtualKey: 0, keyDown: false) else { continue }
                down.flags = []
                up.flags = []
                down.keyboardSetUnicodeString(stringLength: units.count, unicodeString: &units)
                up.keyboardSetUnicodeString(stringLength: units.count, unicodeString: &units)
                down.post(tap: .cghidEventTap)
                up.post(tap: .cghidEventTap)
                usleep(12_000)
            }
            if i < lines.count - 1 {
                press(pressReturn)
                usleep(40_000)
            }
        }
    }

    /// Variante : passe par le presse-papiers et ⌘V (pour les applications récalcitrantes).
    static func paste(_ text: String) {
        var old: String?
        DispatchQueue.main.sync {
            let pb = NSPasteboard.general
            old = pb.string(forType: .string)
            pb.clearContents()
            pb.setString(text, forType: .string)
        }
        usleep(80_000)
        press(KeyPress(code: keyV, flags: .maskCommand, char: nil))
        usleep(800_000)
        DispatchQueue.main.async {
            if let old = old {
                let pb = NSPasteboard.general
                pb.clearContents()
                pb.setString(old, forType: .string)
            }
        }
    }
}

// MARK: - Interface

struct PaletteView: View {
    @AppStorage("mode") private var modeRaw = Mode.universel.rawValue
    @AppStorage("fontSize") private var fontSize = 20.0
    @AppStorage("useClipboard") private var useClipboard = false
    @AppStorage("theme") private var themeIndex = 0
    @State private var note = "Clique sur un symbole : il s'écrit là où est ton curseur."
    @State private var activeForm: FormSpec? = nil

    private var mode: Mode { Mode(rawValue: modeRaw) ?? .universel }

    private var currentTheme: Theme {
        let i = min(max(themeIndex, 0), Catalogue.themes.count - 1)
        return Catalogue.themes[i]
    }

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 6) {
                Picker("", selection: $modeRaw) {
                    ForEach(Mode.allCases) { m in Text(m.rawValue).tag(m.rawValue) }
                }
                .pickerStyle(.segmented)
                .labelsHidden()

                Menu {
                    Button("Boutons plus grands") { fontSize = min(fontSize + 2, 40) }
                    Button("Boutons plus petits") { fontSize = max(fontSize - 2, 12) }
                    Divider()
                    Toggle("Insérer via le presse-papiers", isOn: $useClipboard)
                } label: {
                    Image(systemName: "gearshape")
                }
                .menuStyle(.borderlessButton)
                .frame(width: 28)
            }

            if let form = activeForm {
                FormView(spec: form, mode: mode,
                         onInsert: { ins in
                             activeForm = nil
                             if let p = Typist.problem() {
                                 note = p
                                 return
                             }
                             Typist.perform(ins)
                             note = ins.note ?? form.title
                         },
                         onCancel: { activeForm = nil })
                Spacer()
            } else {
                if mode != .universel {
                    Button {
                        if let p = Typist.problem() {
                            note = p
                            return
                        }
                        let ins = newEquation(for: mode)
                        Typist.perform(ins)
                        if let n = ins.note { note = n }
                    } label: {
                        Label("Nouvelle équation", systemImage: "function")
                            .frame(maxWidth: .infinity)
                    }
                    .controlSize(.large)
                }

                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(Catalogue.sections) { section in
                            sectionHeader(section.title)
                            LazyVGrid(columns: [GridItem(.adaptive(minimum: fontSize * 2.6), spacing: 6)], spacing: 6) {
                                ForEach(section.items) { item in
                                    SymbolButton(item: item, mode: mode, fontSize: fontSize,
                                                 onPress: { ins in note = ins.note ?? item.help },
                                                 onForm: { spec in activeForm = spec },
                                                 onProblem: { p in note = p })
                                }
                            }
                        }

                        sectionHeader("Lexique du chapitre")
                        Picker("Chapitre", selection: $themeIndex) {
                            ForEach(Array(Catalogue.themes.enumerated()), id: \.offset) { pair in
                                Text(pair.element.name).tag(pair.offset)
                            }
                        }
                        .labelsHidden()
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: fontSize * 5), spacing: 6)], spacing: 6) {
                            ForEach(currentTheme.words, id: \.self) { w in
                                WordButton(word: w, fontSize: fontSize) { msg in note = msg }
                            }
                        }
                    }
                    .padding(.bottom, 4)
                }
            }

            Text(note)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(10)
        .frame(minWidth: 280, minHeight: 360)
        .onAppear { Typist.useClipboard = useClipboard }
        .onChange(of: useClipboard) { v in Typist.useClipboard = v }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title.uppercased())
            .font(.caption.weight(.semibold))
            .foregroundColor(.secondary)
            .padding(.top, 4)
    }
}

struct WordButton: View {
    let word: String
    let fontSize: Double
    let onDone: (String) -> Void

    var body: some View {
        Button {
            if let p = Typist.problem() {
                onDone(p)
                return
            }
            Typist.perform(u(word + " "))
            onDone("Mot inséré : \(word)")
        } label: {
            Text(word)
                .font(.system(size: fontSize * 0.7))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .frame(maxWidth: .infinity, minHeight: fontSize * 1.5)
        }
        .buttonStyle(.bordered)
    }
}

struct SymbolButton: View {
    let item: Item
    let mode: Mode
    let fontSize: Double
    let onPress: (Insertion) -> Void
    let onForm: (FormSpec) -> Void
    let onProblem: (String) -> Void

    var body: some View {
        Button {
            if let spec = item.form {
                onForm(spec)
                return
            }
            if let p = Typist.problem() {
                onProblem(p)
                return
            }
            let ins = item.insertion(for: mode)
            Typist.perform(ins)
            onPress(ins)
        } label: {
            Text(item.label)
                .font(.system(size: fontSize))
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .frame(maxWidth: .infinity, minHeight: fontSize * 1.9)
        }
        .buttonStyle(.bordered)
        .help(item.help)
    }
}

struct FormView: View {
    let spec: FormSpec
    let mode: Mode
    let onInsert: (Insertion) -> Void
    let onCancel: () -> Void
    @State private var values: [String]
    @FocusState private var focusedField: Int?

    init(spec: FormSpec, mode: Mode, onInsert: @escaping (Insertion) -> Void, onCancel: @escaping () -> Void) {
        self.spec = spec
        self.mode = mode
        self.onInsert = onInsert
        self.onCancel = onCancel
        _values = State(initialValue: spec.fields.map { $0.initial })
    }

    private var preview: String {
        let ins = spec.build(values, mode)
        return ins.text.trimmingCharacters(in: .whitespaces)
    }

    private var isComplete: Bool {
        !values.contains(where: { clean($0).isEmpty })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(spec.title).font(.headline)
            ForEach(0..<spec.fields.count, id: \.self) { i in
                VStack(alignment: .leading, spacing: 2) {
                    Text(spec.fields[i].label).font(.caption).foregroundColor(.secondary)
                    TextField("", text: $values[i])
                        .textFieldStyle(.roundedBorder)
                        .font(.system(size: 18))
                        .focused($focusedField, equals: i)
                        .onSubmit { submit() }
                }
            }
            Text("Sera inséré : \(preview)")
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(2)
            HStack {
                Button("Annuler", action: onCancel)
                    .keyboardShortcut(.cancelAction)
                Spacer()
                Button("Insérer dans le document") { submit() }
                    .keyboardShortcut(.defaultAction)
                    .buttonStyle(.borderedProminent)
                    .disabled(!isComplete)
            }
        }
        .padding(8)
        .background(RoundedRectangle(cornerRadius: 8).fill(Color.secondary.opacity(0.08)))
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { focusedField = 0 }
        }
    }

    private func submit() {
        guard isComplete else { return }
        onInsert(spec.build(values, mode))
    }
}

// MARK: - Fenêtre flottante

final class PalettePanel: NSPanel {
    override var canBecomeMain: Bool { false }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var panel: PalettePanel!
    private var statusItem: NSStatusItem?

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()
        buildPanel()
        buildStatusItem()
        Typist.beforeTyping = { [weak self] in self?.releaseKeyboard() }
        checkAccessibility()
        showPanel()
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        showPanel()
        return true
    }

    @objc func showPanel() {
        panel.orderFrontRegardless()
    }

    @objc func togglePanel() {
        if panel.isVisible { panel.orderOut(nil) } else { showPanel() }
    }

    /// Après la saisie dans un formulaire, la palette possède le clavier :
    /// on le rend au document avant de taper.
    private func releaseKeyboard() {
        panel.makeFirstResponder(nil)
        if panel.isKeyWindow {
            panel.orderOut(nil)
            panel.orderFrontRegardless()
        }
        if let front = NSWorkspace.shared.frontmostApplication,
           front.processIdentifier != ProcessInfo.processInfo.processIdentifier {
            front.activate(options: [])
        }
    }

    private func buildPanel() {
        let style: NSWindow.StyleMask = [.titled, .closable, .resizable, .utilityWindow, .nonactivatingPanel]
        panel = PalettePanel(contentRect: NSRect(x: 0, y: 0, width: 340, height: 600),
                             styleMask: style, backing: .buffered, defer: false)
        panel.title = "Palette maths"
        panel.level = .floating
        panel.isFloatingPanel = true
        panel.becomesKeyOnlyIfNeeded = true
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.contentView = NSHostingView(rootView: PaletteView())
        panel.setFrameAutosaveName("PalettePanel")
        if panel.frame.origin == .zero, let screen = NSScreen.main {
            let vf = screen.visibleFrame
            panel.setFrameOrigin(NSPoint(x: vf.maxX - 360, y: vf.maxY - 620))
        }
    }

    private func buildStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "function", accessibilityDescription: "Palette maths")
            button.target = self
            button.action = #selector(togglePanel)
        }
    }

    private func buildMenu() {
        let mainMenu = NSMenu()
        let appItem = NSMenuItem()
        mainMenu.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Afficher la palette", action: #selector(showPanel), keyEquivalent: "p")
        appMenu.addItem(withTitle: "Vérifier l'accessibilité", action: #selector(checkAccessibility), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Quitter Palette maths", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        // Menu Édition : nécessaire pour couper/copier/coller dans les champs du formulaire.
        let editItem = NSMenuItem()
        mainMenu.addItem(editItem)
        let editMenu = NSMenu(title: "Édition")
        editMenu.addItem(withTitle: "Annuler", action: Selector(("undo:")), keyEquivalent: "z")
        editMenu.addItem(withTitle: "Couper", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        editMenu.addItem(withTitle: "Copier", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        editMenu.addItem(withTitle: "Coller", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        editMenu.addItem(withTitle: "Tout sélectionner", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = editMenu

        NSApp.mainMenu = mainMenu
    }

    @objc func checkAccessibility() {
        let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
        let trusted = AXIsProcessTrustedWithOptions([key: true] as CFDictionary)
        if !trusted {
            let alert = NSAlert()
            alert.messageText = "Autorisation nécessaire"
            alert.informativeText = """
            Pour que la palette puisse écrire les symboles dans Word ou Pages, macOS doit l'autoriser.

            Réglages Système → Confidentialité et sécurité → Accessibilité → active « Palette maths ».

            Si « Palette maths » est déjà dans la liste avec l'interrupteur activé mais que rien ne s'écrit : retire-la (bouton –), puis rajoute-la (bouton +).

            Puis quitte et relance la palette.
            """
            alert.addButton(withTitle: "Ouvrir les réglages")
            alert.addButton(withTitle: "Plus tard")
            if alert.runModal() == .alertFirstButtonReturn,
               let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") {
                NSWorkspace.shared.open(url)
            }
        }
    }
}

// MARK: - Lancement

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()

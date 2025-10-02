"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Plus, Trash2, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";

// --- Utils ---
const CURRENCY = "€";

function fmtCurrency(n) {
  return (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfYear(d) {
  const x = new Date(d.getFullYear(), 0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfYear(d) {
  const x = new Date(d.getFullYear(), 11, 31);
  x.setHours(23, 59, 59, 999);
  return x;
}

// --- Catégories ---
const CATEGORIES_PRESTATIONS = [
  "Extensions de cils : Pose cil à cil",
  "Extensions de cils : poses légères",
  "Extensions de cils : pose volume russe",
  "Extensions de cils : Pose Liner & Fox eyes",
  "Extensions de cils : pose signature Esma beauty",
  "Suppléments aux extensions de cils",
  "Déposes",
];

const CATEGORIES_DEPENSES = [
  "loyer",
  "facture electricité",
  "facture internet",
  "telephone",
  "fournisseur cil",
  "materiel",
  "logiciel planity",
  "canva pro",
  "capcut pro",
  "chatgpt",
  "icloud stockage",
  "meta ads",
  "meta verified",
  "autres",
];

// --- Local Storage Helpers ---
const LS_KEY = "asmabeauty-dashboard-v1";
function loadLS() {
  if (typeof window === "undefined") return { prestations: [], depenses: [] };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : { prestations: [], depenses: [] };
  } catch {
    return { prestations: [], depenses: [] };
  }
}
function saveLS(data) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// --- Types (JSDoc only) ---
/** @typedef {{ id:string, date:string, client:{nom:string, prenom:string, adresse?:string, email?:string, telephone?:string}, categorie:string, montant:number, commentaire?:string }} Prestation */
/** @typedef {{ id:string, date:string, categorie:string, montant:number, commentaire?:string, variable:boolean }} Depense */

// --- Main Component ---
export default function AsmabeautyDashboard() {
  const [{ prestations, depenses }, setData] = useState(loadLS());

  useEffect(() => {
    saveLS({ prestations, depenses });
  }, [prestations, depenses]);

  // Filtres d'affichage
  const [vue, setVue] = useState("mois"); // jour | mois | annee
  const [dateRef, setDateRef] = useState(() => new Date());

  const periode = useMemo(() => {
    const d = dateRef;
    if (vue === "jour") return { from: startOfDay(d), to: endOfDay(d), label: d.toLocaleDateString("fr-FR") };
    if (vue === "mois") return { from: startOfMonth(d), to: endOfMonth(d), label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) };
    return { from: startOfYear(d), to: endOfYear(d), label: d.getFullYear().toString() };
  }, [vue, dateRef]);

  const inPeriode = (iso) => {
    const t = new Date(iso).getTime();
    return t >= periode.from.getTime() && t <= periode.to.getTime();
  };

  const prestationsPeriode = useMemo(() => prestations.filter(p => inPeriode(p.date)), [prestations, periode]);
  const depensesPeriode = useMemo(() => depenses.filter(d => inPeriode(d.date)), [depenses, periode]);

  // --- KPIs ---
  const caTotal = useMemo(() => prestationsPeriode.reduce((s, p) => s + (p.montant || 0), 0), [prestationsPeriode]);
  const nbPrestations = prestationsPeriode.length;
  const panierMoyen = nbPrestations ? caTotal / nbPrestations : 0;
  const chargesVariables = depensesPeriode.filter(d => d.variable).reduce((s, d) => s + d.montant, 0);
  const margeNette = caTotal - chargesVariables;

  // CA mois précédent (pour comparaison)
  const { prevLabel, prevCA } = useMemo(() => {
    if (vue !== "mois") return { prevLabel: null, prevCA: null };
    const prev = new Date(dateRef.getFullYear(), dateRef.getMonth() - 1, 15);
    const from = startOfMonth(prev).getTime();
    const to = endOfMonth(prev).getTime();
    const ca = prestations
      .filter(p => {
        const t = new Date(p.date).getTime();
        return t >= from && t <= to;
      })
      .reduce((s, p) => s + (p.montant || 0), 0);
    const label = prev.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return { prevLabel: label, prevCA: ca };
  }, [vue, dateRef, prestations]);

  const caDeltaPct = useMemo(() => {
    if (prevCA == null) return null;
    if (prevCA === 0) return caTotal > 0 ? 100 : 0;
    return ((caTotal - prevCA) / prevCA) * 100;
  }, [caTotal, prevCA]);

  // Répartition ventes par prestation
  const repartition = useMemo(() => {
    const map = new Map();
    prestationsPeriode.forEach(p => map.set(p.categorie, (map.get(p.categorie) || 0) + p.montant));
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1;
    return Array.from(map.entries()).map(([categorie, montant]) => ({
      name: categorie,
      value: montant,
      pct: Math.round((montant / total) * 100),
    }));
  }, [prestationsPeriode]);

  // Taux de récurrence des clientes (revenues dans 3-4 semaines)
  const tauxRecurrence = useMemo(() => {
    const byClient = new Map();
    prestations.forEach(p => {
      const key = (p.client?.email || "") + "|" + (p.client?.telephone || "") + "|" + (p.client?.nom || "") + "|" + (p.client?.prenom || "");
      if (!byClient.has(key)) byClient.set(key, []);
      byClient.get(key).push(new Date(p.date).getTime());
    });
    let recurrentes = 0;
    let totalClients = 0;
    byClient.forEach(times => {
      times.sort((a, b) => a - b);
      totalClients += 1;
      for (let i = 1; i < times.length; i++) {
        const diffDays = Math.abs(times[i] - times[i - 1]) / (1000 * 60 * 60 * 24);
        if (diffDays >= 21 && diffDays <= 35) {
          recurrentes += 1;
          break;
        }
      }
    });
    if (totalClients === 0) return 0;
    return Math.round((recurrentes / totalClients) * 100);
  }, [prestations]);

  // Séries temporelles (CA par jour pour la vue sélectionnée)
  const serieCA = useMemo(() => {
    const map = new Map();
    prestationsPeriode.forEach(p => {
      const d = new Date(p.date);
      let key = d.toLocaleDateString("fr-FR");
      if (vue === "annee") key = d.toLocaleDateString("fr-FR", { month: "short" });
      if (vue === "mois") key = d.getDate().toString();
      map.set(key, (map.get(key) || 0) + p.montant);
    });
    return Array.from(map.entries()).map(([name, montant]) => ({ name, montant }));
  }, [prestationsPeriode, vue]);

  // --- Form state ---
  const [formP, setFormP] = useState({
    date: new Date().toISOString(),
    nom: "",
    prenom: "",
    adresse: "",
    email: "",
    telephone: "",
    categorie: CATEGORIES_PRESTATIONS[0],
    montant: "",
    commentaire: "",
  });

  const [formD, setFormD] = useState({
    date: new Date().toISOString(),
    categorie: CATEGORIES_DEPENSES[0],
    montant: "",
    commentaire: "",
    variable: true,
  });

  function addPrestation(e) {
    e.preventDefault();
    const val = {
      id: crypto.randomUUID(),
      date: formP.date,
      client: {
        nom: formP.nom,
        prenom: formP.prenom,
        adresse: formP.adresse,
        email: formP.email,
        telephone: formP.telephone,
      },
      categorie: formP.categorie,
      montant: parseFloat(formP.montant || 0),
      commentaire: formP.commentaire,
    };
    setData((d) => ({ ...d, prestations: [val, ...d.prestations] }));
    setFormP({
      ...formP,
      montant: "",
      commentaire: "",
    });
  }

  function addDepense(e) {
    e.preventDefault();
    const val = {
      id: crypto.randomUUID(),
      date: formD.date,
      categorie: formD.categorie,
      montant: parseFloat(formD.montant || 0),
      commentaire: formD.commentaire,
      variable: !!formD.variable,
    };
    setData((d) => ({ ...d, depenses: [val, ...d.depenses] }));
    setFormD({ ...formD, montant: "", commentaire: "" });
  }

  function deletePrestation(id) {
    setData((d) => ({ ...d, prestations: d.prestations.filter((p) => p.id !== id) }));
  }
  function deleteDepense(id) {
    setData((d) => ({ ...d, depenses: d.depenses.filter((p) => p.id !== id) }));
  }

  // Export CSV rapide
  function exportCSV() {
    const rows = [
      ["type", "date", "categorie", "montant", "nom", "prenom", "adresse", "email", "telephone", "commentaire", "variable"],
      ...prestations.map(p => ["prestation", p.date, p.categorie, p.montant, p.client.nom, p.client.prenom, p.client.adresse, p.client.email, p.client.telephone, p.commentaire, ""]).concat(
        depenses.map(d => ["depense", d.date, d.categorie, d.montant, "", "", "", "", "", d.commentaire, d.variable ? "oui" : "non"]) 
      )
    ];
    const csv = rows.map(r => r.map(v => `"${(v ?? "").toString().replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asmabeauty_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ margin: "0 auto", maxWidth: 1120, padding: "2rem 1rem" }}>
        <header style={{ marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>Asmabeauty – Tableau de bord</h1>
            <p style={{ fontSize: 12, opacity: 0.7 }}>Suivez vos ventes, dépenses & KPI en un clin d'œil.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </header>

        {/* Contrôles de période */}
        <Card className="mb-6">
          <CardContent>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <Tabs value={vue} onValueChange={setVue}>
                <TabsList>
                  <TabsTrigger value="jour">Jour</TabsTrigger>
                  <TabsTrigger value="mois">Mois</TabsTrigger>
                  <TabsTrigger value="annee">Année</TabsTrigger>
                </TabsList>
              </Tabs>

              <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #ddd", borderRadius: 12, padding: "6px 10px", fontSize: 14 }}>
                <CalendarIcon size={16} />
                <span style={{ fontWeight: 600 }}>Période :</span>
                <span>{periode.label}</span>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <Button variant="outline" onClick={() => setDateRef(new Date())}>Aujourd'hui</Button>
                <Button variant="outline" onClick={() => setDateRef(new Date(dateRef.getFullYear(), dateRef.getMonth() - (vue === 'annee' ? 12 : vue === 'mois' ? 1 : 0), dateRef.getDate() - (vue === 'jour' ? 1 : 0)))}>◀</Button>
                <Button variant="outline" onClick={() => setDateRef(new Date(dateRef.getFullYear(), dateRef.getMonth() + (vue === 'annee' ? 12 : vue === 'mois' ? 1 : 0), dateRef.getDate() + (vue === 'jour' ? 1 : 0)))}>▶</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          <Card>
            <CardHeader>
              <CardTitle>CA {vue === 'mois' ? 'du mois' : 'de la période'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{fmtCurrency(caTotal)}</div>
              {prevCA != null && (
                <p style={{ fontSize: 12, opacity: 0.7 }}>
                  vs {prevLabel}: <span>{caDeltaPct >= 0 ? '+' : ''}{Math.round(caDeltaPct)}%</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nombre de prestations</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{nbPrestations}</div>
              <p style={{ fontSize: 12, opacity: 0.7 }}>{nbPrestations === 0 ? 'Aucune prestation' : 'Total enregistré(s)'} </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Panier moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{fmtCurrency(panierMoyen)}</div>
              <p style={{ fontSize: 12, opacity: 0.7 }}>CA ÷ nb prestations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marge nette (période)</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{fmtCurrency(margeNette)}</div>
              <p style={{ fontSize: 10, opacity: 0.7 }}>Recettes – <Badge>charges variables</Badge></p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <Card>
            <CardHeader>
              <CardTitle>Évolution du CA ({periode.label})</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 288 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieCA}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => fmtCurrency(v)} />
                  <Bar dataKey="montant" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition par prestation</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 288 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={repartition} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} />
                  <Tooltip formatter={(v, n, p) => [fmtCurrency(v), p?.payload?.name]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Taux de récurrence */}
        <Card style={{ marginTop: 24 }}>
          <CardHeader>
            <CardTitle style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              Taux de récurrence des clientes (3–4 semaines)
              <Badge style={{ fontSize: 16 }}>{tauxRecurrence}%</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: 12, opacity: 0.7 }}>Basé sur les retours entre 21 et 35 jours pour une même cliente (email/téléphone/nom). Plus vous saisissez d'informations, plus le calcul est précis.</p>
          </CardContent>
        </Card>

        {/* Saisie */}
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une prestation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addPrestation}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <Label>Date</Label>
                    <Input type="datetime-local" value={new Date(formP.date).toISOString().slice(0,16)} onChange={(e) => setFormP({ ...formP, date: new Date(e.target.value).toISOString() })} />
                  </div>
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={formP.categorie} onValueChange={(v) => setFormP({ ...formP, categorie: v })}>
                      <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES_PRESTATIONS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Montant</Label>
                    <Input type="number" step="0.01" value={formP.montant} onChange={(e) => setFormP({ ...formP, montant: e.target.value })} placeholder="0,00" />
                  </div>
                  <div>
                    <Label>Commentaire</Label>
                    <Input value={formP.commentaire} onChange={(e) => setFormP({ ...formP, commentaire: e.target.value })} placeholder="Optionnel" />
                  </div>
                </div>
                <Separator />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <Label>Nom</Label>
                    <Input value={formP.nom} onChange={(e) => setFormP({ ...formP, nom: e.target.value })} />
                  </div>
                  <div>
                    <Label>Prénom</Label>
                    <Input value={formP.prenom} onChange={(e) => setFormP({ ...formP, prenom: e.target.value })} />
                  </div>
                  <div>
                    <Label>Adresse</Label>
                    <Input value={formP.adresse} onChange={(e) => setFormP({ ...formP, adresse: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={formP.email} onChange={(e) => setFormP({ ...formP, email: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <Label>Téléphone</Label>
                    <Input value={formP.telephone} onChange={(e) => setFormP({ ...formP, telephone: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "end", marginTop: 8 }}>
                  <Button type="submit"> <Plus size={16}/> Enregistrer</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ajouter une dépense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addDepense}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <Label>Date</Label>
                    <Input type="datetime-local" value={new Date(formD.date).toISOString().slice(0,16)} onChange={(e) => setFormD({ ...formD, date: new Date(e.target.value).toISOString() })} />
                  </div>
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={formD.categorie} onValueChange={(v) => setFormD({ ...formD, categorie: v })}>
                      <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES_DEPENSES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Montant</Label>
                    <Input type="number" step="0.01" value={formD.montant} onChange={(e) => setFormD({ ...formD, montant: e.target.value })} placeholder="0,00" />
                  </div>
                  <div>
                    <Label>Commentaire</Label>
                    <Input value={formD.commentaire} onChange={(e) => setFormD({ ...formD, commentaire: e.target.value })} placeholder="Optionnel" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Switch id="variable" checked={formD.variable} onCheckedChange={(v) => setFormD({ ...formD, variable: v })} />
                    <Label htmlFor="variable">Charge variable (comptée dans la marge)</Label>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "end", marginTop: 8 }}>
                  <Button type="submit"> <Plus size={16}/> Enregistrer</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tables récap */}
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card>
            <CardHeader style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle>Prestations ({prestationsPeriode.length})</CardTitle>
              <Badge>{fmtCurrency(caTotal)}</Badge>
            </CardHeader>
            <CardContent>
              {prestationsPeriode.length === 0 ? (
                <p style={{ fontSize: 12, opacity: 0.7 }}>Aucune prestation sur cette période.</p>
              ) : (
                <div style={{ maxHeight: 384, overflow: "auto", border: "1px solid #e5e5e5", borderRadius: 12 }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, background: "#fafafa", textAlign: "left" }}>
                      <tr>
                        <th style={{ padding: "8px 12px" }}>Date</th>
                        <th style={{ padding: "8px 12px" }}>Client</th>
                        <th style={{ padding: "8px 12px" }}>Catégorie</th>
                        <th style={{ padding: "8px 12px" }}>Montant</th>
                        <th style={{ padding: "8px 12px" }} />
                      </tr>
                    </thead>
                    <tbody>
                      {prestationsPeriode.map((p) => (
                        <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                          <td style={{ padding: "8px 12px" }}>{new Date(p.date).toLocaleString("fr-FR")}</td>
                          <td style={{ padding: "8px 12px" }}>{p.client.prenom} {p.client.nom}<div style={{ fontSize: 10, opacity: 0.7 }}>{p.client.telephone}</div></td>
                          <td style={{ padding: "8px 12px" }}>{p.categorie}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{fmtCurrency(p.montant)}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right" }}>
                            <Button variant="ghost" size="icon" onClick={() => deletePrestation(p.id)} title="Supprimer">
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle>Dépenses ({depensesPeriode.length})</CardTitle>
              <Badge>{fmtCurrency(depensesPeriode.reduce((s,d)=>s+d.montant,0))}</Badge>
            </CardHeader>
            <CardContent>
              {depensesPeriode.length === 0 ? (
                <p style={{ fontSize: 12, opacity: 0.7 }}>Aucune dépense sur cette période.</p>
              ) : (
                <div style={{ maxHeight: 384, overflow: "auto", border: "1px solid #e5e5e5", borderRadius: 12 }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, background: "#fafafa", textAlign: "left" }}>
                      <tr>
                        <th style={{ padding: "8px 12px" }}>Date</th>
                        <th style={{ padding: "8px 12px" }}>Catégorie</th>
                        <th style={{ padding: "8px 12px" }}>Montant</th>
                        <th style={{ padding: "8px 12px" }}>Variable</th>
                        <th style={{ padding: "8px 12px" }} />
                      </tr>
                    </thead>
                    <tbody>
                      {depensesPeriode.map((d) => (
                        <tr key={d.id} style={{ borderTop: "1px solid #eee" }}>
                          <td style={{ padding: "8px 12px" }}>{new Date(d.date).toLocaleString("fr-FR")}</td>
                          <td style={{ padding: "8px 12px" }}>{d.categorie}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{fmtCurrency(d.montant)}</td>
                          <td style={{ padding: "8px 12px" }}>{d.variable ? <Badge>Oui</Badge> : <Badge>Non</Badge>}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right" }}>
                            <Button variant="ghost" size="icon" onClick={() => deleteDepense(d.id)} title="Supprimer">
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <footer style={{ marginTop: 40, textAlign: "center", fontSize: 10, opacity: 0.6 }}>
          <p>Interface neutre • Données stockées en local (navigateur) • Conçu pour Asmabeauty</p>
        </footer>
      </div>
    </div>
  );
}

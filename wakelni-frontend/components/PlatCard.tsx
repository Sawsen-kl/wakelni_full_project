
'use client';

export type Plat = {
  id: number;
  titre: string;
  description: string;
  prix: string;
  quantite_disponible: number;
  ville: string;
  cuisinier: string;
};

type Props = {
  plat: Plat;
};

export default function PlatCard({ plat }: Props) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: 'white' }}>
      <h3 style={{ margin: '4px 0' }}>{plat.titre}</h3>
      <p style={{ margin: '4px 0', color: '#555' }}>{plat.description}</p>
      <p style={{ margin: '4px 0' }}>
        <strong>{plat.prix}$</strong> · {plat.ville} · par {plat.cuisinier}
      </p>
      <p style={{ margin: '4px 0', fontSize: 14 }}>Quantité disponible : {plat.quantite_disponible}</p>
    </div>
  );
}

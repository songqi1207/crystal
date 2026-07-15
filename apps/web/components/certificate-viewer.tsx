import type { CertificatePayload } from "@astraya/shared";
import { ELEMENTS, CHAKRAS, type ElementKey, type ChakraKey } from "@astraya/shared";
import { truncateHash } from "@astraya/shared";

export function CertificateViewer({
  payload,
  integrityHash,
  signature,
}: {
  payload: CertificatePayload;
  integrityHash: string;
  signature: string;
}) {
  const chakra = CHAKRAS[payload.chakra as ChakraKey];
  const element = ELEMENTS[payload.element as ElementKey];
  return (
    <div className="glass overflow-hidden">
      <div className="bg-meridian p-8 border-b border-night-500/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs tracking-[0.3em] text-starlight-500">ASTRAYA · CERTIFICATE</div>
            <h2 className="mt-2 font-serif text-2xl text-pearl-100">{payload.product}</h2>
            <p className="mt-1 text-sm text-pearl-300">{payload.productEn}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-pearl-400">SERIAL</div>
            <div className="font-mono text-sm text-starlight-500 tracking-wider">{payload.serialNo}</div>
          </div>
        </div>
      </div>

      <div className="p-8 grid sm:grid-cols-2 gap-6 text-sm">
        <Detail label="来源 Origin" value={payload.origin} />
        <Detail label="五行 Element" value={element ? `${element.zh} ${element.en}` : payload.element} />
        <Detail label="脉轮 Chakra" value={chakra ? `${chakra.zh} ${chakra.en}` : payload.chakra} />
        <Detail label="重量 Weight" value={`${payload.weightGrams} g`} />
        {payload.blessedBy && (
          <Detail
            label="开光大师 Blessed by"
            value={payload.blessedBy}
            sub={payload.blessedAt ? new Date(payload.blessedAt).toLocaleDateString() : undefined}
          />
        )}
        <Detail label="订单 Order" value={payload.orderCode} />
      </div>

      <div className="hair-line" />

      <div className="p-8 text-xs text-pearl-400 space-y-2">
        <Row label="NFC UID" value={payload.nfcUid} mono />
        <Row label="NFC Hash" value={truncateHash(payload.nfcHash, 10, 8)} mono />
        <Row label="Integrity" value={truncateHash(integrityHash, 10, 8)} mono />
        <Row label="HMAC Signature" value={truncateHash(signature, 10, 8)} mono />
        <Row label="Issued At" value={new Date(payload.issuedAt).toLocaleString()} />
        <p className="mt-4 text-pearl-500/80 text-[11px] leading-relaxed">
          Phase 1 凭证为 PDF + 数据库存证。Phase 2 上线后，此证书可由拥有者一键回铸至 Base 链上 ERC-721 NFT，
          NFC 哈希将同步写入合约作为物实绑定凭据。
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-xs tracking-[0.2em] text-pearl-400">{label.toUpperCase()}</div>
      <div className="mt-1 text-pearl-100">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-pearl-400">{sub}</div>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-pearl-400">{label}</span>
      <span className={mono ? "font-mono text-pearl-200" : "text-pearl-200"}>{value}</span>
    </div>
  );
}

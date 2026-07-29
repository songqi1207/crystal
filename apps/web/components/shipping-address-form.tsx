"use client";

import { useMemo, useState } from "react";

export type ShippingAddressValue = {
  recipient: string;
  phone: string;
  countryCode: string;
  country: string;
  province: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string;
};

export const EMPTY_SHIPPING_ADDRESS: ShippingAddressValue = {
  recipient: "",
  phone: "",
  countryCode: "CN",
  country: "中国",
  province: "",
  city: "",
  district: "",
  addressLine: "",
  postalCode: "",
};

const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");

const PRIORITY = ["CN", "HK", "MO", "TW", "SG", "MY", "JP", "KR", "US", "CA", "GB", "AU"];

const REGIONS: Record<string, string[]> = {
  CN: ["北京市", "天津市", "河北省", "山西省", "内蒙古自治区", "辽宁省", "吉林省", "黑龙江省", "上海市", "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省", "河南省", "湖北省", "湖南省", "广东省", "广西壮族自治区", "海南省", "重庆市", "四川省", "贵州省", "云南省", "西藏自治区", "陕西省", "甘肃省", "青海省", "宁夏回族自治区", "新疆维吾尔自治区", "香港特别行政区", "澳门特别行政区", "台湾省"],
  US: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"],
  CA: ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"],
  AU: ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"],
  JP: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
  GB: ["England", "Scotland", "Wales", "Northern Ireland"],
};

const CITY_SUGGESTIONS: Record<string, string[]> = {
  "北京市": ["北京市"], "天津市": ["天津市"], "上海市": ["上海市"], "重庆市": ["重庆市"],
  "广东省": ["广州市", "深圳市", "珠海市", "佛山市", "东莞市", "中山市", "惠州市", "汕头市", "江门市", "湛江市"],
  "浙江省": ["杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市", "金华市", "台州市", "丽水市", "舟山市"],
  "江苏省": ["南京市", "苏州市", "无锡市", "常州市", "南通市", "扬州市", "徐州市", "盐城市", "泰州市", "镇江市"],
  "四川省": ["成都市", "绵阳市", "德阳市", "乐山市", "宜宾市", "泸州市", "南充市", "达州市", "攀枝花市"],
  "福建省": ["福州市", "厦门市", "泉州市", "漳州市", "莆田市", "龙岩市", "三明市", "南平市", "宁德市"],
  "山东省": ["济南市", "青岛市", "烟台市", "潍坊市", "临沂市", "淄博市", "威海市", "济宁市", "泰安市"],
  "河南省": ["郑州市", "洛阳市", "开封市", "南阳市", "新乡市", "许昌市", "商丘市", "周口市", "信阳市"],
  "湖北省": ["武汉市", "宜昌市", "襄阳市", "荆州市", "黄冈市", "孝感市", "十堰市", "荆门市"],
  "湖南省": ["长沙市", "株洲市", "湘潭市", "衡阳市", "岳阳市", "常德市", "郴州市", "邵阳市", "怀化市"],
  "河北省": ["石家庄市", "唐山市", "保定市", "邯郸市", "廊坊市", "沧州市", "秦皇岛市", "张家口市"],
  "陕西省": ["西安市", "咸阳市", "宝鸡市", "渭南市", "榆林市", "汉中市", "延安市"],
  "辽宁省": ["沈阳市", "大连市", "鞍山市", "抚顺市", "锦州市", "营口市", "丹东市"],
  "安徽省": ["合肥市", "芜湖市", "蚌埠市", "阜阳市", "滁州市", "安庆市", "马鞍山市", "黄山市"],
  "江西省": ["南昌市", "赣州市", "九江市", "上饶市", "宜春市", "吉安市", "景德镇市"],
  "云南省": ["昆明市", "曲靖市", "大理白族自治州", "丽江市", "玉溪市", "西双版纳傣族自治州", "红河哈尼族彝族自治州"],
  "贵州省": ["贵阳市", "遵义市", "六盘水市", "安顺市", "毕节市", "黔东南苗族侗族自治州"],
  "广西壮族自治区": ["南宁市", "柳州市", "桂林市", "北海市", "玉林市", "梧州市", "钦州市"],
  "海南省": ["海口市", "三亚市", "儋州市", "三沙市"],
  "山西省": ["太原市", "大同市", "长治市", "晋中市", "临汾市", "运城市"],
  "黑龙江省": ["哈尔滨市", "齐齐哈尔市", "牡丹江市", "大庆市", "佳木斯市"],
  "吉林省": ["长春市", "吉林市", "四平市", "延边朝鲜族自治州", "通化市"],
  "甘肃省": ["兰州市", "天水市", "酒泉市", "张掖市", "武威市", "庆阳市"],
  "青海省": ["西宁市", "海东市", "海西蒙古族藏族自治州", "海南藏族自治州"],
  "内蒙古自治区": ["呼和浩特市", "包头市", "鄂尔多斯市", "赤峰市", "呼伦贝尔市", "通辽市"],
  "宁夏回族自治区": ["银川市", "石嘴山市", "吴忠市", "固原市", "中卫市"],
  "新疆维吾尔自治区": ["乌鲁木齐市", "克拉玛依市", "喀什地区", "伊犁哈萨克自治州", "昌吉回族自治州", "阿克苏地区"],
  "西藏自治区": ["拉萨市", "日喀则市", "林芝市", "昌都市", "山南市", "那曲市"],
};

const DISTRICT_SUGGESTIONS: Record<string, string[]> = {
  "北京市": ["东城区", "西城区", "朝阳区", "海淀区", "丰台区", "石景山区", "通州区", "昌平区", "大兴区", "顺义区", "房山区", "门头沟区", "怀柔区", "平谷区", "密云区", "延庆区"],
  "上海市": ["黄浦区", "徐汇区", "长宁区", "静安区", "普陀区", "虹口区", "杨浦区", "浦东新区", "闵行区", "宝山区", "嘉定区", "金山区", "松江区", "青浦区", "奉贤区", "崇明区"],
  "广州市": ["越秀区", "海珠区", "荔湾区", "天河区", "白云区", "黄埔区", "番禺区", "花都区", "南沙区", "增城区", "从化区"],
  "深圳市": ["福田区", "罗湖区", "南山区", "盐田区", "宝安区", "龙岗区", "龙华区", "坪山区", "光明区", "大鹏新区"],
  "杭州市": ["上城区", "拱墅区", "西湖区", "滨江区", "萧山区", "余杭区", "临平区", "钱塘区", "富阳区", "临安区"],
  "南京市": ["玄武区", "秦淮区", "建邺区", "鼓楼区", "浦口区", "栖霞区", "雨花台区", "江宁区", "六合区", "溧水区", "高淳区"],
  "成都市": ["锦江区", "青羊区", "金牛区", "武侯区", "成华区", "龙泉驿区", "青白江区", "新都区", "温江区", "双流区", "郫都区", "新津区"],
  "武汉市": ["江岸区", "江汉区", "硚口区", "汉阳区", "武昌区", "青山区", "洪山区", "东西湖区", "蔡甸区", "江夏区", "黄陂区", "新洲区"],
  "西安市": ["新城区", "碑林区", "莲湖区", "灞桥区", "未央区", "雁塔区", "阎良区", "临潼区", "长安区", "高陵区", "鄠邑区"],
  "重庆市": ["渝中区", "江北区", "南岸区", "九龙坡区", "沙坪坝区", "大渡口区", "北碚区", "渝北区", "巴南区", "两江新区"],
};

export function ShippingAddressForm({ value, onChange }: { value: ShippingAddressValue; onChange: (value: ShippingAddressValue) => void }) {
  const [manualRegion, setManualRegion] = useState(false);
  const [manualCity, setManualCity] = useState(false);
  const [manualDistrict, setManualDistrict] = useState(false);
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(["zh-CN"], { type: "region" });
    return COUNTRY_CODES.map((code) => ({ code, name: names.of(code) || code })).sort((a, b) => {
      const ai = PRIORITY.indexOf(a.code); const bi = PRIORITY.indexOf(b.code);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      return a.name.localeCompare(b.name, "zh-CN");
    });
  }, []);
  const regions = REGIONS[value.countryCode] || [];
  const cities = value.countryCode === "CN" ? CITY_SUGGESTIONS[value.province] || [] : [];
  const districts = value.countryCode === "CN" ? DISTRICT_SUGGESTIONS[value.city] || [] : [];

  function update(patch: Partial<ShippingAddressValue>) { onChange({ ...value, ...patch }); }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="收件人"><input className="address-input" autoComplete="shipping name" value={value.recipient} onChange={(e) => update({ recipient: e.target.value })} placeholder="姓名" /></Field>
        <Field label="联系电话"><input className="address-input" autoComplete="shipping tel" value={value.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="手机号或国际号码" /></Field>
      </div>
      <div className="grid gap-px overflow-hidden rounded-xl border border-pearl-400/25 bg-pearl-400/20 sm:grid-cols-2">
        <CascadeField label="国家／地区">
          <select className="cascade-input" autoComplete="shipping country" value={value.countryCode} onChange={(e) => { const option = countries.find((item) => item.code === e.target.value); setManualRegion(false); setManualCity(false); setManualDistrict(false); update({ countryCode: e.target.value, country: option?.name || e.target.value, province: "", city: "", district: "" }); }}>
            {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </CascadeField>
        <CascadeField label="省／州／行政区">
          {regions.length && !manualRegion ? (
            <select className="cascade-input" autoComplete="shipping address-level1" value={value.province} onChange={(e) => { if (e.target.value === "__manual") { setManualRegion(true); update({ province: "", city: "", district: "" }); return; } setManualCity(false); setManualDistrict(false); update({ province: e.target.value, city: "", district: "" }); }}>
              <option value="">请选择省／州</option>{regions.map((region) => <option key={region}>{region}</option>)}<option value="__manual">其他（手动填写）</option>
            </select>
          ) : <input className="cascade-input" autoComplete="shipping address-level1" autoFocus={manualRegion} value={value.province} onChange={(e) => update({ province: e.target.value })} placeholder="输入州、省或行政区" />}
        </CascadeField>
        <CascadeField label="城市">
          {value.countryCode === "CN" && !value.province ? (
            <select className="cascade-input" disabled><option>请先选择省／州</option></select>
          ) : cities.length && !manualCity ? (
            <select className="cascade-input" autoComplete="shipping address-level2" value={value.city} onChange={(e) => { if (e.target.value === "__manual") { setManualCity(true); update({ city: "", district: "" }); return; } setManualDistrict(false); update({ city: e.target.value, district: "" }); }}>
              <option value="">请选择城市</option>{cities.map((city) => <option key={city}>{city}</option>)}<option value="__manual">其他（手动填写）</option>
            </select>
          ) : <input className="cascade-input" autoComplete="shipping address-level2" autoFocus={manualCity} value={value.city} onChange={(e) => update({ city: e.target.value, district: "" })} placeholder={value.province ? "输入城市" : "请先选择省／州"} />}
        </CascadeField>
        <CascadeField label="区／县">
          {value.countryCode === "CN" && !value.city ? (
            <select className="cascade-input" disabled><option>请先选择城市</option></select>
          ) : districts.length && !manualDistrict ? (
            <select className="cascade-input" autoComplete="shipping address-level3" value={value.district} onChange={(e) => { if (e.target.value === "__manual") { setManualDistrict(true); update({ district: "" }); return; } update({ district: e.target.value }); }}>
              <option value="">请选择区／县</option>{districts.map((district) => <option key={district}>{district}</option>)}<option value="__manual">其他（手动填写）</option>
            </select>
          ) : <input className="cascade-input" autoComplete="shipping address-level3" autoFocus={manualDistrict} value={value.district} onChange={(e) => update({ district: e.target.value })} placeholder={value.city ? "输入区、县或街区" : "请先选择城市"} />}
        </CascadeField>
      </div>
      <Field label="街道与门牌号"><textarea className="address-input min-h-[84px]" autoComplete="shipping street-address" value={value.addressLine} onChange={(e) => update({ addressLine: e.target.value })} placeholder="街道、门牌号、小区、楼栋、房间号" /></Field>
      <Field label="邮政编码（选填）"><input className="address-input" autoComplete="shipping postal-code" value={value.postalCode} onChange={(e) => update({ postalCode: e.target.value })} placeholder="Postal code" /></Field>
      <style jsx>{`.address-input{width:100%;border-radius:.75rem;border:1px solid rgba(168,165,152,.25);background:rgba(10,14,39,.75);padding:.7rem .9rem;font-size:.875rem;color:#f0eee6;outline:none}.address-input:focus{border-color:#e8c37a;box-shadow:0 0 0 3px rgba(232,195,122,.15)}.cascade-input{width:100%;border:0;background:transparent;padding:.15rem 0;color:#f0eee6;outline:none;font-size:.875rem}.cascade-input:focus{color:#e8c37a}.cascade-input option,select.address-input option{background:#10142d;color:#f0eee6}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] tracking-[0.15em] text-pearl-400">{label}</span>{children}</label>;
}

function CascadeField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block bg-night-900/55 px-3 py-2.5"><span className="mb-1 block text-[10px] tracking-[0.14em] text-pearl-500">{label}</span>{children}</label>;
}

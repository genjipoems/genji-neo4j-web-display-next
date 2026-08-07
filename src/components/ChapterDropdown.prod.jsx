'use client';

import MultiSelectDropdown from './MultiSelectDropdown.prod.jsx';

const CHAPTER_NAMES = {
  '01': 'Kiritsubo', '02': 'Hahakigi', '03': 'Utsusemi', '04': 'Yūgao', '05': 'Wakamurasaki',
  '06': 'Suetsumuhana', '07': 'Momiji no Ga', '08': 'Hana no En', '09': 'Aoi',
  '10': 'Sakaki', '11': 'Hanachirusato', '12': 'Suma', '13': 'Akashi', '14': 'Miotsukushi',
  '15': 'Yomogiu', '16': 'Sekiya', '17': 'E-awase', '18': 'Matsukaze',
  '19': 'Usugumo', '20': 'Asagao', '21': 'Otome', '22': 'Tamakazura', '23': 'Hatsune',
  '24': 'Kochō', '25': 'Hotaru', '26': 'Tokonatsu', '27': 'Kagaribi',
  '28': 'Nowaki', '29': 'Miyuki', '30': 'Fujibakama', '31': 'Makibashira', '32': 'Umegae',
  '33': 'Fuji no Uraba', '34': 'Wakana: Jō', '35': 'Wakana: Ge',
  '36': 'Kashiwagi', '37': 'Yokobue', '38': 'Suzumushi', '39': 'Yūgiri', '40': 'Minori',
  '41': 'Maboroshi', '42': 'Niou Miya', '43': 'Kōbai', '44': 'Takekawa',
  '45': 'Hashihime', '46': 'Shiigamoto', '47': 'Agemaki', '48': 'Sawarabi', '49': 'Yadorigi',
  '50': 'Azumaya', '51': 'Ukifune', '52': 'Kagerō', '53': 'Tenarai', '54': 'Yume no Ukihashi'
};

const CHAPTER_KANJI = {
  '01': '桐壺', '02': '帚木', '03': '空蝉', '04': '夕顔', '05': '若紫', '06': '末摘花', '07': '紅葉賀', '08': '花宴', '09': '葵',
  '10': '榊', '11': '花散里', '12': '須磨', '13': '明石', '14': '澪標', '15': '蓬生', '16': '関屋', '17': '絵合', '18': '松風',
  '19': '薄雲', '20': '朝顔', '21': '乙女', '22': '玉鬘', '23': '初音', '24': '胡蝶', '25': '螢', '26': '常夏', '27': '篝火',
  '28': '野分', '29': '行幸', '30': '藤袴', '31': '真木柱', '32': '梅枝', '33': '藤裏葉', '34': '若菜上', '35': '若菜下',
  '36': '柏木', '37': '横笛', '38': '鈴虫', '39': '夕霧', '40': '御法', '41': '幻', '42': '匂宮', '43': '紅梅', '44': '竹河',
  '45': '橋姫', '46': '椎本', '47': '総角', '48': '早蕨', '49': '宿木', '50': '東屋', '51': '浮舟', '52': '蜻蛉', '53': '手習', '54': '夢浮橋'
};

const chapterItems = Object.keys(CHAPTER_NAMES)
  .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  .map((num) => ({
    key: num,
    label: `${num}: ${CHAPTER_NAMES[num]}`,
    sublabel: CHAPTER_KANJI[num],
  }));

export default function ChapterDropdown({ value, onChange, allowedKeys = null }) {
  return (
    <MultiSelectDropdown
      items={chapterItems}
      value={value}
      onChange={onChange}
      allowedKeys={allowedKeys}
      placeholder="Select Chapters"
      sortComparator={(a, b) => parseInt(a.key, 10) - parseInt(b.key, 10)}
    />
  );
}
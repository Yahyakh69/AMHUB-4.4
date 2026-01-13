import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Device } from '../types';

interface MapPickerProps {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
  isMaximized?: boolean;
  devices?: Device[];
  flyTo?: { lat: number; lng: number };
}

// Mapbox Configuration
const MAPBOX_TOKEN = "pk.eyJ1IjoiYmlsYWxhbXQiLCJhIjoiY21qcHdmNjd1M2ljMTNncXh4OG10bjM1ZSJ9.DdrBIWn_ukTldrDk0_7oWg";
const STYLE_STREETS = "mapbox/streets-v12"; 
const STYLE_SATELLITE = "mapbox/satellite-streets-v12";

type MapMode = 'STREETS' | 'SATELLITE' | 'SATELLITE_KMZ';

// --- POLYGON 1: BURJ AL ARAB AREA ---
const BURJ_AL_ARAB_COORDS_RAW = [
  [55.2054530263027, 25.1262512816172],
  [55.20464419759391, 25.12574851980844],
  [55.20397392054301, 25.12529442814185],
  [55.20383998263244, 25.12525419004125],
  [55.20365483985238, 25.12517959165504],
  [55.20344344201154, 25.1251257133426],
  [55.20313887629928, 25.12501616002302],
  [55.20282264057317, 25.12491842496572],
  [55.20228421913797, 25.12477353102161],
  [55.20193074914167, 25.12475866513119],
  [55.20172481305774, 25.12473740490399],
  [55.20150502764705, 25.12472719120977],
  [55.20124669013763, 25.12471313700893],
  [55.20100114194292, 25.12471609668711],
  [55.20075863544378, 25.12471202031803],
  [55.20048211603302, 25.12469185562744],
  [55.20033293011885, 25.12470584720491],
  [55.20018951947362, 25.12473867287252],
  [55.19995979150939, 25.12484546358962],
  [55.1996696401642, 25.12500050686841],
  [55.19330087585392, 25.12942988734104],
  [55.19042331777567, 25.13153508942747],
  [55.19010959014585, 25.131824369073],
  [55.18959733573653, 25.13225763785928],
  [55.18910607315882, 25.13266278227233],
  [55.18880578612224, 25.1329354344176],
  [55.18866851995359, 25.13316122971356],
  [55.18856388778254, 25.13346398453901],
  [55.1884352975429, 25.1342447215967],
  [55.18836142368719, 25.13491093454788],
  [55.18824576739099, 25.13563250499978],
  [55.18822612123573, 25.13618352885048],
  [55.18826846961483, 25.13656186713987],
  [55.18853791658936, 25.13710101024965],
  [55.18883511611627, 25.13751081795843],
  [55.18922760803023, 25.13796002465516],
  [55.19045012350376, 25.1394122081589],
  [55.19103950187345, 25.14009130440306],
  [55.19071686744758, 25.14028283288521],
  [55.18915158630266, 25.13838056819469],
  [55.18894480580236, 25.13826541871855],
  [55.18866339326826, 25.13834364344247],
  [55.18849700192145, 25.13843697306002],
  [55.18810869795337, 25.13864948300909],
  [55.18777313407561, 25.1389579306419],
  [55.18741031800707, 25.13947066512401],
  [55.18676909247244, 25.14026225114464],
  [55.18656072824228, 25.14068418792481],
  [55.18655155554492, 25.14096387030703],
  [55.18654056286078, 25.14130462179818],
  [55.18643059379866, 25.14149074866177],
  [55.18633668661379, 25.14166314908793],
  [55.186284583429, 25.14174673718428],
  [55.1860969100948, 25.14187860211221],
  [55.18595250501455, 25.14191503461812],
  [55.18571900771936, 25.1419598398928],
  [55.1855510263545, 25.14196464838576],
  [55.18526041147864, 25.14197533799095],
  [55.18509382429909, 25.14196980330465],
  [55.18500134633383, 25.14197731408373],
  [55.18493713565564, 25.14196772474771],
  [55.18486981411163, 25.14196308540194],
  [55.18483845302673, 25.14198512086963],
  [55.18478724725892, 25.14202549170325],
  [55.18469234923231, 25.142156798471],
  [55.1843120142191, 25.1427255231206],
  [55.18422955157099, 25.14270553705573],
  [55.18416803134706, 25.14268193711704],
  [55.18410721989388, 25.1426456715465],
  [55.18405261579935, 25.14260866839033],
  [55.18396447040872, 25.14254932491],
  [55.18390667909156, 25.14249898193652],
  [55.18386292215407, 25.14245841690381],
  [55.18379097698126, 25.14238000290004],
  [55.18375808067555, 25.14233586460728],
  [55.18371659917069, 25.14228473029745],
  [55.18368132592276, 25.14223286814761],
  [55.18364615777769, 25.14217182976414],
  [55.18362070491243, 25.14210166311243],
  [55.18357589604774, 25.1420097561551],
  [55.18355609358563, 25.14195148663015],
  [55.18353383423118, 25.14186720500788],
  [55.183535004736, 25.14180531257315],
  [55.18436547924986, 25.14156074489054],
  [55.1844358164383, 25.14153761151302],
  [55.18445763741489, 25.14150446101021],
  [55.18448318190828, 25.14146161052606],
  [55.18451247776632, 25.14141646433329],
  [55.18481087295088, 25.1407114550376],
  [55.18481366491479, 25.14065277015298],
  [55.18487292677407, 25.14056702628448],
  [55.18493602803292, 25.14049382134581],
  [55.18510907409936, 25.14038811694439],
  [55.18529182646243, 25.14032853248537],
  [55.18588121112034, 25.14020298947201],
  [55.18613626259244, 25.14022248313615],
  [55.18659074185425, 25.13996098103681],
  [55.18682337676674, 25.13977211616367],
  [55.18707846237483, 25.13948377510074],
  [55.18756942401695, 25.13882966841176],
  [55.18790515138809, 25.13857331351223],
  [55.18804829164038, 25.13844355778698],
  [55.18818996763878, 25.1382882119721],
  [55.18832083600603, 25.13811824891778],
  [55.18840060999651, 25.13795824855285],
  [55.18839026769266, 25.13781091248201],
  [55.18829047474603, 25.13755932914085],
  [55.18817941153589, 25.13744193679553],
  [55.1880933484401, 25.13722456808432],
  [55.1879652082564, 25.13694262771351],
  [55.18788027254627, 25.13668739437923],
  [55.1878245958633, 25.13636199625392],
  [55.18779996585481, 25.13587284672424],
  [55.18780199784398, 25.13553817050171],
  [55.18791883093322, 25.13459752721603],
  [55.18788802231223, 25.13357112953034],
  [55.18788103431764, 25.13335165326716],
  [55.18779187383077, 25.13301109835047],
  [55.18776212701844, 25.13278334770455],
  [55.18766573868675, 25.13237633154201],
  [55.18725661356701, 25.13188609415283],
  [55.183990835064, 25.12850294497719],
  [55.18464533320695, 25.12800976578867],
  [55.18639529539788, 25.12988843915634],
  [55.18843901566985, 25.13210227685562],
  [55.19124071731056, 25.13001383011659],
  [55.18587027862333, 25.12465627034496],
  [55.18581445282001, 25.12460057646574],
  [55.18575348416167, 25.124483976855],
  [55.19439006606794, 25.11696254310914],
  [55.19555209977003, 25.11728789693324],
  [55.20631466876365, 25.12541755222289],
  [55.2054530263027, 25.1262512816172]
];

// --- POLYGON 2: JBR / MARINA / PALM AREA ---
// Data from 2nd CSV file
const JBR_ZONE_COORDS_RAW = [
  [55.14776640957243, 25.09489107136724],
  [55.13919360266144, 25.08710349351763],
  [55.13795111404588, 25.0877162191251],
  [55.13751874411987, 25.08777993449782],
  [55.13689746298116, 25.08773080395726],
  [55.13647370969532, 25.08770899464129],
  [55.12225039903593, 25.08358888911062],
  [55.1219950690861, 25.08362533573868],
  [55.12176638676083, 25.08358207443531],
  [55.12157465214325, 25.08349188490539],
  [55.12146329608231, 25.08343247773444],
  [55.12091209072228, 25.0837441962394],
  [55.12099979953168, 25.08355274106134],
  [55.11838680788099, 25.08056145990944],
  [55.11813504334453, 25.08058320296886],
  [55.11868281444523, 25.08016506496847],
  [55.11865001246262, 25.0799411350775],
  [55.11863377002396, 25.07984192144338],
  [55.11861378071225, 25.07968635225942],
  [55.11867127289045, 25.07951005584592],
  [55.11877461058916, 25.07938337312736],
  [55.11893277696124, 25.07921689021626],
  [55.12332125014341, 25.07557252575785],
  [55.12346162627961, 25.07547257304471],
  [55.12358527129363, 25.07532392328716],
  [55.12357538802886, 25.07500328442561],
  [55.12345356928981, 25.07427197222032],
  [55.12326979105067, 25.07373617363213],
  [55.12302382334272, 25.07297867660259],
  [55.12312747904504, 25.07263546858326],
  [55.12342413239625, 25.072347414243],
  [55.12365730180636, 25.07214709988922],
  [55.12392553246197, 25.07193883643822],
  [55.13020427300437, 25.0704988492042],
  [55.1309856581812, 25.07061778103336],
  [55.1313334148923, 25.07070777906757],
  [55.13165115170325, 25.07079000801491],
  [55.13203085160754, 25.07115435161275],
  [55.13295942574369, 25.07204536732025],
  [55.13334064739406, 25.07250719128378],
  [55.13334326598314, 25.07270530814571],
  [55.13324249387286, 25.07311161164062],
  [55.13325218399983, 25.07362281515897],
  [55.13338624048801, 25.07403654757029],
  [55.13362386105033, 25.07439684414614],
  [55.13399722244196, 25.07472346495505],
  [55.13442980167546, 25.07493154710775],
  [55.13512805136605, 25.07512740867348],
  [55.1355382122433, 25.07522381170913],
  [55.13602893583186, 25.07542903466045],
  [55.13632601857779, 25.07563480973498],
  [55.13668133461199, 25.07598445016967],
  [55.13699186962933, 25.07636863528196],
  [55.13723882458576, 25.07677884430197],
  [55.13727475629879, 25.07701661916484],
  [55.13744680613358, 25.07793998864556],
  [55.13799131634981, 25.07798695885313],
  [55.13844239458993, 25.07807255053583],
  [55.13861825867143, 25.07830510995571],
  [55.13863011373822, 25.07847159817478],
  [55.13861710164134, 25.07871319136023],
  [55.13857938677247, 25.0791285688079],
  [55.13852809476636, 25.07936085203075],
  [55.13865481740854, 25.07944010137562],
  [55.13883735687091, 25.07940184318981],
  [55.13902140640126, 25.07926110662978],
  [55.13925110741604, 25.07923606897061],
  [55.13958096160184, 25.07944792517395],
  [55.13968796083365, 25.0796498100785],
  [55.13984660960104, 25.07979125810978],
  [55.14000377524989, 25.07986431389953],
  [55.14027203465162, 25.07992379521426],
  [55.14051491934149, 25.07993199406037],
  [55.14082868380226, 25.08015579297553],
  [55.14104292840425, 25.08033233661237],
  [55.14118747721493, 25.08056290977229],
  [55.14115269444715, 25.08087171959389],
  [55.14107738508362, 25.08101600734828],
  [55.14127434789617, 25.08135005259341],
  [55.14161034296528, 25.08128359363267],
  [55.14211240419103, 25.08130982769421],
  [55.14252366640283, 25.08154610973467],
  [55.14275060240318, 25.08186511075691],
  [55.14288652469217, 25.08210823007787],
  [55.14283165200136, 25.08233829545862],
  [55.14276377799344, 25.0825671790566],
  [55.14300972683675, 25.08271992626518],
  [55.14314645940616, 25.08256030330422],
  [55.14327750024992, 25.08231272877268],
  [55.14357127989056, 25.0820977166704],
  [55.14392656448373, 25.0820820962609],
  [55.1442818903994, 25.08227260833112],
  [55.14483326015113, 25.08286948803847],
  [55.14534973664228, 25.08344349871142],
  [55.14556570780626, 25.08348038960623],
  [55.14776605294126, 25.08366338351064],
  [55.14941386500627, 25.08212315973329],
  [55.15598390943236, 25.08808170992278],
  [55.14776640957243, 25.09489107136724]
];

// --- POLYGON 3: BOULEVARD ZONES (Dubai Mall, Sky View, Emmar) ---
// Contains 3 distinct polygons
const BOULEVARD_ZONES_RAW = [
  // DB Dubai Mall
  [
    [55.27847031300007, 25.19495435700003],
    [55.28007736100005, 25.19321275500005],
    [55.28134218600007, 25.19409364700005],
    [55.28284180300005, 25.19577649200005],
    [55.28401883400005, 25.19762730700006],
    [55.28877478400005, 25.19492593700005],
    [55.29010598300005, 25.19703958300005],
    [55.28457500200005, 25.19999143900003],
    [55.28480636400008, 25.20162974700003],
    [55.28495121100008, 25.20242610500003],
    [55.28351246200003, 25.20288348800005],
    [55.28189433400007, 25.20322240700006],
    [55.28002307600008, 25.20351051700004],
    [55.27988591800005, 25.20272965900006],
    [55.27977077600008, 25.20189799300005],
    [55.27865300600007, 25.20247467800004],
    [55.27886049100005, 25.20394255800005],
    [55.27835898000006, 25.20399126500007],
    [55.27569154400004, 25.20431978300007],
    [55.27471259300006, 25.20282138000005],
    [55.27867182000006, 25.20072857700006],
    [55.27765560700004, 25.19876631200003],
    [55.27718379100003, 25.19787399500007],
    [55.27643264300008, 25.19693464600005],
    [55.27709308900006, 25.19634258300005],
    [55.27775420700004, 25.19565096100007],
    [55.27847031300007, 25.19495435700003]
  ],
  // DB Sky View
  [
    [55.27123083400005, 25.19778126100005],
    [55.27195294600006, 25.19833697500007],
    [55.27286755800003, 25.19882508200004],
    [55.27522857700006, 25.19937314200007],
    [55.27682581900007, 25.19977499500004],
    [55.27771347200007, 25.20060859700004],
    [55.27375761200005, 25.20269206600005],
    [55.27425114200008, 25.20345267200003],
    [55.27364649600003, 25.20402772300002],
    [55.27338743100006, 25.20439371500004],
    [55.27342445600004, 25.20467137400004],
    [55.27352719100003, 25.20489481700002],
    [55.27425547300004, 25.20585781900007],
    [55.27473783400006, 25.20676037800007],
    [55.27554619900008, 25.20802707200005],
    [55.27419504100004, 25.20874155600006],
    [55.27824998900007, 25.21483854500008],
    [55.27725135700007, 25.21535517300003],
    [55.27316054500005, 25.20928858800005],
    [55.27180434000007, 25.21000573400005],
    [55.27017713600003, 25.20766045100004],
    [55.26964957000007, 25.20686108500007],
    [55.26879517000003, 25.20543206400004],
    [55.26669364900005, 25.20226876800007],
    [55.26561742900003, 25.20075315300005],
    [55.26504617400008, 25.19996739000004],
    [55.26453325500006, 25.19931406500007],
    [55.25776916300003, 25.19197694900004],
    [55.25500509900007, 25.18909738500003],
    [55.25921143700003, 25.18596103800007],
    [55.26171674900007, 25.18855590000004],
    [55.26571707700003, 25.19273626000006],
    [55.26725663200006, 25.19435103000006],
    [55.26760965300008, 25.19376831200003],
    [55.26778732400004, 25.19326041100004],
    [55.26786302100004, 25.19282638700003],
    [55.26799914200006, 25.19211717000007],
    [55.26850991200007, 25.19240834400006],
    [55.26908485200005, 25.19279042100004],
    [55.26918418200006, 25.19337542800002],
    [55.27012476600004, 25.19365923100003],
    [55.26997294600005, 25.19505956700004],
    [55.27002988700008, 25.19573981000008],
    [55.27033603500007, 25.19660623800007],
    [55.27072689800008, 25.19725323100005],
    [55.27123083400005, 25.19778126100005]
  ],
  // DB Emmar
  [
    [55.26973549700006, 25.19108352800004],
    [55.26933690500005, 25.19070188500007],
    [55.27589865000004, 25.18646652400002],
    [55.27664860400006, 25.18733470800004],
    [55.27736615200007, 25.18825350800006],
    [55.27823077900007, 25.18933949700005],
    [55.27897142400008, 25.19010257000008],
    [55.27977840300008, 25.19067328200003],
    [55.28059580000007, 25.19121054800007],
    [55.28135199100007, 25.19189574400008],
    [55.27901384500007, 25.19302958400004],
    [55.27598351300003, 25.19652477700004],
    [55.27561785400007, 25.19620204100005],
    [55.27516404200003, 25.19589272500008],
    [55.27470688900007, 25.19564474900005],
    [55.27440019800008, 25.19550977700004],
    [55.27399939500003, 25.19549681600006],
    [55.27348267400004, 25.19561466400006],
    [55.27315074300003, 25.19584502600003],
    [55.27249779800007, 25.19504977200006],
    [55.27223426000006, 25.19479190800007],
    [55.27136145700007, 25.19412059900003],
    [55.27189103700005, 25.19310281300005],
    [55.26973549700006, 25.19108352800004]
  ]
];

// --- EXTRA ZONES (FROM LATEST 3 CSV FILES) ---
const EXTRA_ZONES_RAW = [
  // File 1
  [
    [55.30087165626863,25.19846152395082],
    [55.29686940026812,25.20116847460413],
    [55.2964205085274,25.20135922358919],
    [55.29583436409273,25.20144095738711],
    [55.29509715895985,25.20152528724464],
    [55.29457939787788,25.2013819392132],
    [55.29392084204478,25.20125509271505],
    [55.29350023196411,25.20100412468518],
    [55.29289351341448,25.20073949840775],
    [55.29256470307103,25.20048415798678],
    [55.29239356322964,25.20029428384855],
    [55.29222253657594,25.20010425904271],
    [55.29184649730643,25.19984560097991],
    [55.29141056466201,25.19905305321903],
    [55.29109814497923,25.19859880846259],
    [55.29063249965844,25.19808203161519],
    [55.29009540323825,25.19724934743087],
    [55.28924610093437,25.1960497807231],
    [55.28897536487742,25.19570562434829],
    [55.2885420382456,25.19508248811267],
    [55.28849479494648,25.19500391123331],
    [55.2885317228912,25.19490821072298],
    [55.28857103586297,25.19480027017234],
    [55.28861646187026,25.19469910142414],
    [55.28875002338672,25.19458717688044],
    [55.28899794942198,25.19447383298583],
    [55.28918778589939,25.19444824587501],
    [55.29011461640557,25.19412517460778],
    [55.29035770231808,25.19403649163848],
    [55.29049053170755,25.19394973996079],
    [55.29060265582807,25.193798681963],
    [55.29079100918695,25.19358040247974],
    [55.29107913572948,25.19326568109776],
    [55.2912427063663,25.19308874141048],
    [55.29138191648927,25.19288478744476],
    [55.29156511441674,25.19271580681364],
    [55.29186231214703,25.19227384773339],
    [55.29199153210571,25.19208696191998],
    [55.29213078444947,25.19188251773944],
    [55.29218074066072,25.19162037854941],
    [55.29225284573364,25.19146582473053],
    [55.2924551867598,25.19100294490076],
    [55.29256088073952,25.19091406700541],
    [55.29273215532821,25.19091150074129],
    [55.29295701172865,25.19091573747509],
    [55.29323289333558,25.1909983374967],
    [55.29358191756954,25.19115825528441],
    [55.29391971915067,25.19130452057678],
    [55.3006336763802,25.19755454264412],
    [55.30074920511561,25.19761449987299],
    [55.30087878440044,25.19775672656343],
    [55.30096308769657,25.19787626282464],
    [55.30103271521593,25.19804985968975],
    [55.30103936185073,25.19816796914272],
    [55.30101283729532,25.19827684309028],
    [55.30097200617072,25.19839691043218],
    [55.30087165626863,25.19846152395082]
  ],
  // File 2
  [
    [55.3005919056178,25.05897242749896],
    [55.30074097115772,25.05884414565685],
    [55.30111521738993,25.05846611946695],
    [55.30156073416016,25.0583577010521],
    [55.30173693690649,25.05835491961001],
    [55.30212257736978,25.05833805274207],
    [55.302445093218,25.058459887675],
    [55.30264989742469,25.05857053489253],
    [55.30286961456339,25.05873319027112],
    [55.30338743852749,25.05896551705776],
    [55.30715054413471,25.0612765683773],
    [55.31138251192976,25.06392832924316],
    [55.31521068341136,25.06637468264266],
    [55.31563438459491,25.06666341013326],
    [55.31571553121115,25.06689431661201],
    [55.31584012125285,25.06704967095488],
    [55.31594497890101,25.06728908072339],
    [55.31601862817791,25.06746732076516],
    [55.31602074281208,25.0676374219064],
    [55.31607659915813,25.06784996703766],
    [55.31605279559975,25.06799400242921],
    [55.31606621373516,25.06816474321933],
    [55.31599595110688,25.06835688073971],
    [55.3157855512943,25.06868291877792],
    [55.31503379075888,25.06961554252006],
    [55.31140544142741,25.07382154615695],
    [55.3112342539753,25.07403084626235],
    [55.3109502039875,25.07432504138046],
    [55.31052863540446,25.07466426589311],
    [55.30951640655577,25.07529523478665],
    [55.30912415988193,25.07553401087779],
    [55.30849655729858,25.07589862676532],
    [55.30825348845402,25.07606312319811],
    [55.3080541406144,25.07618015139055],
    [55.30792117917255,25.07623146876115],
    [55.307846203084,25.07624054740397],
    [55.30773069680644,25.07630185466869],
    [55.30755785286096,25.07634688659216],
    [55.30744589762373,25.07635261382889],
    [55.30727360075224,25.07631378431404],
    [55.30707731526939,25.07627912064419],
    [55.30684244534848,25.07623145167464],
    [55.30621764820373,25.07578888451508],
    [55.30475762266065,25.07446007256231],
    [55.30228556859324,25.07219788436807],
    [55.29858019591268,25.06879232889933],
    [55.29817149389942,25.06842589765408],
    [55.29753237491412,25.06787409812217],
    [55.2973644797875,25.06768809352329],
    [55.29636601402731,25.06661072172354],
    [55.29601814592512,25.06620625761987],
    [55.29578140571178,25.06563033853779],
    [55.29591716899898,25.06481999153052],
    [55.29652011192947,25.06364229932436],
    [55.2967445146807,25.06323605392866],
    [55.29694834152036,25.06295793838353],
    [55.29715029537266,25.06265562011825],
    [55.29734874489701,25.06244931546639],
    [55.29785812290076,25.06191280684583],
    [55.29974164301485,25.05993254293351],
    [55.3005919056178,25.05897242749896]
  ],
  // File 3
  [
    [55.28085058822278,25.22040295701403],
    [55.27725135688294,25.21535517295435],
    [55.27824998883148,25.214838545263],
    [55.2804360696181,25.21799632885428],
    [55.28089354565969,25.21804677230736],
    [55.28117207460173,25.21815815271697],
    [55.28145544097158,25.21827146724579],
    [55.28188298604623,25.21844243764552],
    [55.28216296397083,25.21866738541413],
    [55.28286550042193,25.21923183431901],
    [55.28650405641166,25.21715456319069],
    [55.28892796257651,25.22063000844244],
    [55.28996690642341,25.22196029529026],
    [55.29150203651412,25.22389000120773],
    [55.29255362953855,25.22508938699238],
    [55.29259772334424,25.22529453848128],
    [55.29255256413662,25.22540849810785],
    [55.29249755490186,25.22553858384347],
    [55.29241091329104,25.22566354975408],
    [55.29221698319085,25.22585089598571],
    [55.29077476046009,25.22711006860746],
    [55.29059504170771,25.22734121458489],
    [55.29023771075231,25.22785640120008],
    [55.28998464815025,25.22827685807415],
    [55.2897112719447,25.22872700286565],
    [55.28961165506789,25.22888141917147],
    [55.28937341376968,25.22906907899513],
    [55.28896173833288,25.22925450056114],
    [55.28875506113881,25.22931061633812],
    [55.28859835812233,25.22931450474481],
    [55.28837400567676,25.2293695356413],
    [55.28811516960236,25.229400106545],
    [55.28768628963121,25.22936707989217],
    [55.28682512148074,25.22927869564278],
    [55.28085058822278,25.22040295701403]
  ]
];

// Convert [Lng, Lat] -> [Lat, Lng]
const POLYGON_1_LATLNGS = BURJ_AL_ARAB_COORDS_RAW.map(coord => [coord[1], coord[0]] as [number, number]);
const POLYGON_2_LATLNGS = JBR_ZONE_COORDS_RAW.map(coord => [coord[1], coord[0]] as [number, number]);
const POLYGON_3_LATLNGS_LIST = BOULEVARD_ZONES_RAW.map(poly => 
  poly.map(coord => [coord[1], coord[0]] as [number, number])
);
const POLYGON_4_LATLNGS_LIST = EXTRA_ZONES_RAW.map(poly => 
  poly.map(coord => [coord[1], coord[0]] as [number, number])
);

// Drone SVG Icon Definition
const getDroneSvg = (color: string) => {
  const c = color; 
  const id = color.replace('#', '').replace(/\s/g, '');
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><filter id="glow-${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#glow-${id})"><path d="M40 40 h20 v20 h-20 z" fill="${c}" /><path d="M40 40 L25 25" stroke="${c}" stroke-width="4" stroke-linecap="round" /><path d="M60 40 L75 25" stroke="${c}" stroke-width="4" stroke-linecap="round" /><path d="M40 60 L25 75" stroke="${c}" stroke-width="4" stroke-linecap="round" /><path d="M60 60 L75 75" stroke="${c}" stroke-width="4" stroke-linecap="round" /><circle cx="25" cy="25" r="8" stroke="${c}" stroke-width="2" fill="none" /><circle cx="75" cy="25" r="8" stroke="${c}" stroke-width="2" fill="none" /><circle cx="25" cy="75" r="8" stroke="${c}" stroke-width="2" fill="none" /><circle cx="75" cy="75" r="8" stroke="${c}" stroke-width="2" fill="none" /><path d="M15 25 h20 M25 15 v20" stroke="${c}" stroke-width="1" opacity="0.6" /><path d="M65 25 h20 M75 15 v20" stroke="${c}" stroke-width="1" opacity="0.6" /><path d="M15 75 h20 M25 65 v20" stroke="${c}" stroke-width="1" opacity="0.6" /><path d="M65 75 h20 M75 65 v20" stroke="${c}" stroke-width="1" opacity="0.6" /><path d="M45 35 L55 35 L50 25 Z" fill="${c}" /></g></svg>`;
};

// Home/Dock SVG Icon Definition - Updated to be a distinct filled Home Icon
const getDockSvg = (color: string) => {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.5))">
    <path d="M12 3L2 12H5V20H9V14H15V20H19V12H22L12 3Z" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
};

export const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onLocationSelect, isMaximized, devices = [], flyTo }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  // Ref to hold a LayerGroup for polygons instead of a single Polygon layer
  const polygonsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  
  const deviceMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const dockMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('STREETS');

  const handleRecenterTarget = () => {
    if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1 });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        onLocationSelect(newLat, newLng);
        mapInstanceRef.current?.flyTo([newLat, newLng], 15);
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false 
    });
    mapInstanceRef.current = map;

    const initialLayer = L.tileLayer(`https://api.mapbox.com/styles/v1/${STYLE_STREETS}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
      attribution: '© Mapbox © OpenStreetMap',
      tileSize: 512,
      zoomOffset: -1,
      maxZoom: 20
    }).addTo(map);
    tileLayerRef.current = initialLayer;

    // Initialize Layer Group for Polygons
    const polyGroup = L.layerGroup().addTo(map);
    polygonsLayerGroupRef.current = polyGroup;

    const targetIcon = L.icon({
       iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
       shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
       iconSize: [25, 41],
       iconAnchor: [12, 41],
       popupAnchor: [1, -34],
       shadowSize: [41, 41]
    });

    const marker = L.marker([lat, lng], { icon: targetIcon, draggable: true }).addTo(map);
    marker.bindPopup("<div class='font-sans p-1'><b class='text-slate-800 uppercase text-[10px] tracking-widest'>Mission Origin</b></div>");
    
    marker.on('dragend', (e) => {
      const marker = e.target;
      const position = marker.getLatLng();
      onLocationSelect(position.lat, position.lng);
    });

    targetMarkerRef.current = marker;

    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
       const { lat, lng } = e.latlng;
       onLocationSelect(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      deviceMarkersRef.current.clear();
      dockMarkersRef.current.clear();
      polygonsLayerGroupRef.current = null;
    };
  }, []); 

  useEffect(() => {
    if (mapInstanceRef.current) {
        if (tileLayerRef.current) tileLayerRef.current.remove();
        
        const isSatellite = mapMode === 'SATELLITE' || mapMode === 'SATELLITE_KMZ';
        const style = isSatellite ? STYLE_SATELLITE : STYLE_STREETS;

        const newLayer = L.tileLayer(`https://api.mapbox.com/styles/v1/${style}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`, {
            attribution: '© Mapbox © OpenStreetMap',
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 20
        }).addTo(mapInstanceRef.current);
        tileLayerRef.current = newLayer;

        // Polygon Logic - Support for Multiple Polygons
        if (polygonsLayerGroupRef.current) {
             polygonsLayerGroupRef.current.clearLayers();
             
             if (mapMode === 'SATELLITE_KMZ') {
                 // Polygon 1: Burj Al Arab (Amber)
                 L.polygon(POLYGON_1_LATLNGS, {
                     color: '#f59e0b', // Amber-500
                     weight: 2,
                     fillColor: '#fcd34d',
                     fillOpacity: 0.2
                 }).addTo(polygonsLayerGroupRef.current);

                 // Polygon 2: JBR Zone (Cyan)
                 L.polygon(POLYGON_2_LATLNGS, {
                     color: '#06b6d4', // Cyan-500
                     weight: 2,
                     fillColor: '#67e8f9',
                     fillOpacity: 0.2
                 }).addTo(polygonsLayerGroupRef.current);

                 // Polygon 3: Boulevard Zones (Purple)
                 POLYGON_3_LATLNGS_LIST.forEach(polyCoords => {
                    L.polygon(polyCoords, {
                        color: '#d946ef', // Fuchsia-500
                        weight: 2,
                        fillColor: '#e879f9',
                        fillOpacity: 0.2
                    }).addTo(polygonsLayerGroupRef.current!);
                 });

                 // Polygon 4: Extra Zones (Lime)
                 POLYGON_4_LATLNGS_LIST.forEach(polyCoords => {
                    L.polygon(polyCoords, {
                        color: '#84cc16', // Lime-500
                        weight: 2,
                        fillColor: '#bef264',
                        fillOpacity: 0.2
                    }).addTo(polygonsLayerGroupRef.current!);
                 });
             }
        }
    }
  }, [mapMode]);

  // Update marker position without forcing camera to follow (fixes snap-back)
  useEffect(() => {
    if (targetMarkerRef.current) {
        targetMarkerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  useEffect(() => {
    if (mapInstanceRef.current && flyTo) {
        mapInstanceRef.current.flyTo([flyTo.lat, flyTo.lng], 19, { animate: true, duration: 1.5 });
    }
  }, [flyTo]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300);
    }
  }, [isMaximized]);

  // Optimized Device Marker Updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const currentMap = mapInstanceRef.current;
    
    // --- DRONE MARKERS ---
    const activeDroneSns = new Set<string>();

    devices.forEach(device => {
        // Use unified position logic (live, offline, or dock fallback)
        if (device.position && (device.position.lat !== 0 || device.position.lng !== 0)) {
            const { lat, lng } = device.position;
            const yaw = device.telemetry?.yaw || 0;
            const speed = device.telemetry?.speed || 0;
            const height = device.telemetry?.height || 0;
            const battery_percent = device.telemetry?.battery_percent || 0;
            const remaining_flight_time = device.telemetry?.remaining_flight_time || 0;
            const link_signal_quality = device.telemetry?.link_signal_quality || 0;

            activeDroneSns.add(device.device_sn);

            // Logic: 
            // 1. Offline -> Red (#ef4444)
            // 2. Online & Flying -> Green (#10b981)
            // 3. Online & Docked -> Yellow (#eab308)
            
            let statusColor = '#ef4444'; // Red (Default Offline)
            let statusText = 'OFFLINE';
            let statusTextColor = 'text-red-600';
            let statusDotClass = 'bg-red-500';

            if (device.status) {
                if (device.is_flying) {
                    statusColor = '#10b981'; // Green (Flying)
                    statusText = 'FLYING';
                    statusTextColor = 'text-emerald-600';
                    statusDotClass = 'bg-emerald-500 animate-pulse';
                } else {
                    statusColor = '#eab308'; // Yellow (Docked/Standby)
                    statusText = 'DOCKED';
                    statusTextColor = 'text-yellow-600';
                    statusDotClass = 'bg-yellow-500';
                }
            }
            
            // Format remaining time
            const m = Math.floor(remaining_flight_time / 60);
            const s = Math.floor(remaining_flight_time % 60);

            const popupContent = `
                <div class="font-sans min-w-[240px] p-2 text-slate-900">
                    <div class="flex flex-col border-b border-slate-100 pb-2 mb-2">
                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">DRONE ID</span>
                        <h3 class="font-black text-slate-900 text-sm uppercase">${device.nickname}</h3>
                    </div>
                    
                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1.5 mb-3">
                        <div class="flex justify-between items-center font-mono text-[10px]">
                            <span class="text-slate-400 uppercase font-bold">Latitude</span>
                            <span class="text-slate-900 font-bold">${lat.toFixed(7)}</span>
                        </div>
                        <div class="flex justify-between items-center font-mono text-[10px]">
                            <span class="text-slate-400 uppercase font-bold">Longitude</span>
                            <span class="text-slate-900 font-bold">${lng.toFixed(7)}</span>
                        </div>
                    </div>

                    ${device.status ? `
                    <div class="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] bg-slate-50/50 p-2 rounded border border-slate-100">
                        <div class="flex flex-col">
                            <span class="text-slate-400 text-[8px] font-black uppercase tracking-tighter">Speed</span>
                            <span class="font-bold text-slate-800">${speed.toFixed(1)} m/s</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-slate-400 text-[8px] font-black uppercase tracking-tighter">ALT</span>
                            <span class="font-bold text-slate-800">${height.toFixed(1)} m</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-slate-400 text-[8px] font-black uppercase tracking-tighter">Battery</span>
                            <span class="font-bold ${battery_percent < 20 ? 'text-red-600 animate-pulse' : 'text-slate-800'}">${battery_percent.toFixed(0)}%</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-slate-400 text-[8px] font-black uppercase tracking-tighter">REM. TIME</span>
                            <span class="font-bold text-slate-800">${m}m ${s}s</span>
                        </div>
                        <div class="flex flex-col col-span-2 mt-1 pt-1 border-t border-slate-200/50">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-400 text-[8px] font-black uppercase tracking-tighter">Link Quality</span>
                                <span class="font-bold text-slate-800">${link_signal_quality}%</span>
                            </div>
                        </div>
                    </div>
                    ` : `
                    <div class="text-[10px] text-slate-500 italic text-center p-2 bg-slate-50 rounded border border-slate-100">
                       Device is offline. Last known or docked position shown.
                    </div>
                    `}
                    
                    <div class="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                         <span class="text-[8px] text-slate-400 font-mono">SN: ${device.device_sn}</span>
                         <div class="flex items-center gap-1">
                            <div class="w-1.5 h-1.5 rounded-full ${statusDotClass}"></div>
                            <span class="text-[8px] font-black ${statusTextColor} uppercase">${statusText}</span>
                         </div>
                    </div>
                </div>`;

            const createIcon = () => {
                const svgString = getDroneSvg(statusColor);
                return L.divIcon({
                    className: 'custom-drone-icon',
                    html: `<div style="transform: rotate(${yaw}deg); width: 48px; height: 48px; background-image: url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}'); background-repeat: no-repeat; background-position: center; background-size: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); opacity: ${device.status ? 1 : 0.6}; transition: transform 0.4s ease-out;"></div>`,
                    iconSize: [48, 48],
                    iconAnchor: [24, 24],
                });
            };

            let marker = deviceMarkersRef.current.get(device.device_sn);
            if (marker) {
                marker.setLatLng([lat, lng]);
                marker.setIcon(createIcon());
                if (marker.getPopup()?.isOpen()) marker.getPopup()?.setContent(popupContent);
                else marker.bindPopup(popupContent, { className: 'tactical-drone-popup' });
            } else {
                marker = L.marker([lat, lng], { icon: createIcon(), zIndexOffset: 1000 });
                marker.bindPopup(popupContent, { className: 'tactical-drone-popup' });
                marker.addTo(currentMap);
                deviceMarkersRef.current.set(device.device_sn, marker);
            }
        }
    });

    deviceMarkersRef.current.forEach((marker, sn) => {
        if (!activeDroneSns.has(sn)) {
            marker.remove();
            deviceMarkersRef.current.delete(sn);
        }
    });

    // --- DOCK / HOME MARKERS ---
    const activeDockSns = new Set<string>();
    
    devices.forEach(device => {
        if (device.dock) {
            const { sn, latitude, longitude, nickname } = device.dock;
            if (latitude !== 0 || longitude !== 0) {
                 activeDockSns.add(sn);
                 const dockColor = '#3b82f6'; // Blue for docks

                 const dockIcon = L.divIcon({
                    className: 'custom-dock-icon',
                    html: `<div style="width: 40px; height: 40px; background-image: url('data:image/svg+xml;charset=utf-8,${encodeURIComponent(getDockSvg(dockColor))}'); background-repeat: no-repeat; background-position: center; background-size: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));"></div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20],
                });
                
                const dockPopup = `
                    <div class="font-sans p-2 text-slate-900 min-w-[150px]">
                       <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">DOCK / HOME</div>
                       <h3 class="font-black text-slate-900 text-xs uppercase mb-1">${nickname || 'Station'}</h3>
                       <div class="text-[9px] font-mono text-slate-500">${sn}</div>
                       <div class="mt-1 pt-1 border-t border-slate-100 text-[9px] text-blue-600 font-bold">Connected</div>
                    </div>
                `;

                let marker = dockMarkersRef.current.get(sn);
                if (marker) {
                    marker.setLatLng([latitude, longitude]);
                } else {
                    marker = L.marker([latitude, longitude], { icon: dockIcon, zIndexOffset: 500 });
                    marker.bindPopup(dockPopup);
                    marker.addTo(currentMap);
                    dockMarkersRef.current.set(sn, marker);
                }
            }
        }
    });

    dockMarkersRef.current.forEach((marker, sn) => {
        if (!activeDockSns.has(sn)) {
            marker.remove();
            dockMarkersRef.current.delete(sn);
        }
    });

  }, [devices]);

  return (
    <div className="relative h-full w-full bg-slate-900 group">
      <div ref={mapContainerRef} className="h-full w-full z-0" />
      
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 z-[1000] w-full max-w-xs">
        <form onSubmit={handleSearch} className="shadow-2xl">
          <div className="relative flex items-center">
             <input 
                type="text" 
                placeholder="Find Grid Location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/90 backdrop-blur-xl text-slate-100 placeholder:text-slate-600 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 pr-10 rounded border border-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 shadow-lg"
             />
             <button type="submit" disabled={isSearching} className="absolute right-3 text-slate-500 hover:text-cyan-400">
                {isSearching ? <div className="animate-spin h-3.5 w-3.5 border-2 border-cyan-500 border-t-transparent rounded-full" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
             </button>
          </div>
        </form>
      </div>

      {/* Control Cluster */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
        <button 
          onClick={handleRecenterTarget}
          className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded px-4 py-2.5 shadow-2xl text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all active:scale-95 group mb-2"
        >
          <svg className="w-4 h-4 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Recenter Target</span>
        </button>

        <div className="flex bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded p-1 shadow-2xl">
          <button 
            onClick={() => setMapMode('STREETS')}
            className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${mapMode === 'STREETS' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            Map
          </button>
          <button 
            onClick={() => setMapMode('SATELLITE')}
            className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${mapMode === 'SATELLITE' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            Sat
          </button>
          <button 
            onClick={() => setMapMode('SATELLITE_KMZ')}
            className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${mapMode === 'SATELLITE_KMZ' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            Sat + KMZ
          </button>
        </div>
      </div>
    </div>
  );
};
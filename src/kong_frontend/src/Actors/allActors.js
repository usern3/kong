import { createGenericActor } from './createGenericActor';

import { canisterId as kongBackendCanisterId, idlFactory as kongBackendIdlFactory } from "../../../declarations/kong_backend/index.js";
import { canisterId as kongFaucetCanisterId, idlFactory as kongFaucetIdlFactory } from "../../../declarations/kong_faucet/index.js";
import { canisterId as ckbtcCanisterId, idlFactory as ckbtcIdlFactory } from "../../../declarations/ckbtc_ledger/index.js";
import { canisterId as ckethCanisterId, idlFactory as ckethIdlFactory } from "../../../declarations/cketh_ledger/index.js";
import { canisterId as ckusdcCanisterId, idlFactory as ckusdcIdlFactory } from "../../../declarations/ckusdc_ledger/index.js";
import { canisterId as icpCanisterId, idlFactory as icpIdlFactory } from "../../../declarations/icp_ledger/index.js";
import { canisterId as ckusdtCanisterId, idlFactory as ckusdtIdlFactory } from "../../../declarations/ckusdt_ledger/index.js";
import { canisterId as bitsCanisterId, idlFactory as bitsIdlFactory } from "../../../declarations/bits_ledger/index.js";
import { canisterId as yugeCanisterId, idlFactory as yugeIdlFactory } from "../../../declarations/yuge_ledger/index.js";
import { canisterId as chatCanisterId, idlFactory as chatIdlFactory } from "../../../declarations/chat_ledger/index.js";
import { canisterId as dkpCanisterId, idlFactory as dkpIdlFactory } from "../../../declarations/dkp_ledger/index.js";
import { canisterId as nanasCanisterId, idlFactory as nanasIdlFactory } from "../../../declarations/nanas_ledger/index.js";
import { canisterId as nd64CanisterId, idlFactory as nd64IdlFactory } from "../../../declarations/nd64_ledger/index.js";
import { canisterId as alpacalbCanisterId, idlFactory as alpacalbIdlFactory } from "../../../declarations/alpacalb_ledger/index.js";
import { canisterId as partyCanisterId, idlFactory as partyIdlFactory } from "../../../declarations/party_ledger/index.js";
import { canisterId as sneedCanisterId, idlFactory as sneedIdlFactory } from "../../../declarations/sneed_ledger/index.js";
import { canisterId as clownCanisterId, idlFactory as clownIdlFactory } from "../../../declarations/clown_ledger/index.js";
import { canisterId as exeCanisterId, idlFactory as exeIdlFactory } from "../../../declarations/exe_ledger/index.js";
import { canisterId as wumboCanisterId, idlFactory as wumboIdlFactory } from "../../../declarations/wumbo_ledger/index.js";
import { canisterId as mcsCanisterId, idlFactory as mcsIdlFactory } from "../../../declarations/mcs_ledger/index.js";
import { canisterId as damonicCanisterId, idlFactory as damonicIdlFactory } from "../../../declarations/damonic_ledger/index.js";
import { canisterId as bobCanisterId, idlFactory as bobIdlFactory } from "../../../declarations/bob_ledger/index.js";
import { canisterId as burnCanisterId, idlFactory as burnIdlFactory } from "../../../declarations/burn_ledger/index.js";
import { canisterId as dcdCanisterId, idlFactory as dcdIdlFactory } from "../../../declarations/dcd_ledger/index.js";
import { canisterId as dittoCanisterId, idlFactory as dittoIdlFactory } from "../../../declarations/ditto_ledger/index.js";
import { canisterId as fplCanisterId, idlFactory as fplIdlFactory } from "../../../declarations/fpl_ledger/index.js";
import { canisterId as gldgovCanisterId, idlFactory as gldgovIdlFactory } from "../../../declarations/gldgov_ledger/index.js";
import { canisterId as icvcCanisterId, idlFactory as icvcIdlFactory } from "../../../declarations/icvc_ledger/index.js";
import { canisterId as ntnCanisterId, idlFactory as ntnIdlFactory } from "../../../declarations/ntn_ledger/index.js";
import { canisterId as ogyCanisterId, idlFactory as ogyIdlFactory } from "../../../declarations/ogy_ledger/index.js";
import { canisterId as owlCanisterId, idlFactory as owlIdlFactory } from "../../../declarations/owl_ledger/index.js";
import { canisterId as nicpCanisterId, idlFactory as nicpIdlFactory } from "../../../declarations/nicp_ledger/index.js";
import { canisterId as wtnCanisterId, idlFactory as wtnIdlFactory } from "../../../declarations/wtn_ledger/index.js";

export const { useKongBackendBackend, KongBackendActor } = createGenericActor(kongBackendCanisterId, kongBackendIdlFactory, 'KongBackend');
export const { useKongFaucetBackend, KongFaucetActor } = createGenericActor(kongFaucetCanisterId, kongFaucetIdlFactory, 'KongFaucet');
export const { useCkbtcBackend, CkbtcActor } = createGenericActor(ckbtcCanisterId, ckbtcIdlFactory, 'Ckbtc');
export const { useCkethBackend, CkethActor } = createGenericActor(ckethCanisterId, ckethIdlFactory, 'Cketh');
export const { useCkusdcBackend, CkusdcActor } = createGenericActor(ckusdcCanisterId, ckusdcIdlFactory, 'Ckusdc');
export const { useIcpBackend, IcpActor } = createGenericActor(icpCanisterId, icpIdlFactory, 'Icp');
export const { useCkusdtBackend, CkusdtActor } = createGenericActor(ckusdtCanisterId, ckusdtIdlFactory, 'Ckusdt');
export const { useBITSBackend, BITSActor } = createGenericActor(bitsCanisterId, bitsIdlFactory, 'BITS');
export const { useYUGEBackend, YUGEActor } = createGenericActor(yugeCanisterId, yugeIdlFactory, 'YUGE');
export const { useCHATBackend, CHATActor } = createGenericActor(chatCanisterId, chatIdlFactory, 'CHAT');
export const { useDKPBackend, DKPActor } = createGenericActor(dkpCanisterId, dkpIdlFactory, 'DKP');
export const { useNANASBackend, NANASActor } = createGenericActor(nanasCanisterId, nanasIdlFactory, 'NANAS');
export const { useND64Backend, ND64Actor } = createGenericActor(nd64CanisterId, nd64IdlFactory, 'ND64');
export const { useALPACALBBackend, ALPACALBActor } = createGenericActor(alpacalbCanisterId, alpacalbIdlFactory, 'ALPACALB');
export const { usePARTYBackend, PARTYActor } = createGenericActor(partyCanisterId, partyIdlFactory, 'PARTY');
export const { useSNEEDBackend, SNEEDActor } = createGenericActor(sneedCanisterId, sneedIdlFactory, 'SNEED');
export const { useCLOWNBackend, CLOWNActor } = createGenericActor(clownCanisterId, clownIdlFactory, 'CLOWN');
export const { useEXEBackend, EXEActor } = createGenericActor(exeCanisterId, exeIdlFactory, 'EXE');
export const { useWUMBOBackend, WUMBOActor } = createGenericActor(wumboCanisterId, wumboIdlFactory, 'WUMBO');
export const { useMCSBackend, MCSActor } = createGenericActor(mcsCanisterId, mcsIdlFactory, 'MCS');
export const { useDAMONICBackend, DAMONICActor } = createGenericActor(damonicCanisterId, damonicIdlFactory, 'DAMONIC');
export const { useBOBBackend, BOBActor } = createGenericActor(bobCanisterId, bobIdlFactory, 'BOB');
export const { useBURNBackend, BURNActor } = createGenericActor(burnCanisterId, burnIdlFactory, 'BURN');
export const { useDCDBackend, DCDActor } = createGenericActor(dcdCanisterId, dcdIdlFactory, 'DCD');
export const { useDITTOBackend, DITTOActor } = createGenericActor(dittoCanisterId, dittoIdlFactory, 'DITTO');
export const { useFPLBackend, FPLActor } = createGenericActor(fplCanisterId, fplIdlFactory, 'FPL');
export const { useGLDGovBackend, GLDGovActor } = createGenericActor(gldgovCanisterId, gldgovIdlFactory, 'GLDGov');
export const { useICVCBackend, ICVCActor } = createGenericActor(icvcCanisterId, icvcIdlFactory, 'ICVC');
export const { useNTNBackend, NTNActor } = createGenericActor(ntnCanisterId, ntnIdlFactory, 'NTN');
export const { useOGYBackend, OGYActor } = createGenericActor(ogyCanisterId, ogyIdlFactory, 'OGY');
export const { useOWLBackend, OWLActor } = createGenericActor(owlCanisterId, owlIdlFactory, 'OWL');
export const { useNICPBackend, NICPActor } = createGenericActor(nicpCanisterId, nicpIdlFactory, 'NICP');
export const { useWTNBackend, WTNActor } = createGenericActor(wtnCanisterId, wtnIdlFactory, 'WTN');
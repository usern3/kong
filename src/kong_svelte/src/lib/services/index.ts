import { TokenService } from './TokenService';
import { PoolService } from './PoolService';
import { SwapService } from './SwapService';
import { UserService } from './UserService';

export const tokenService = TokenService.getInstance();
export const poolService = PoolService.getInstance();
export const swapService = SwapService.getInstance();
export const userService = UserService.getInstance(); 
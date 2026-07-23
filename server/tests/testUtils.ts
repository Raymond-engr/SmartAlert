import User, { UserRole, IUser } from '../src/model/user.model';
import tokenService from '../src/services/token.service';

interface CreateUserOptions {
  name?: string;
  email: string;
  password?: string;
  role: UserRole;
  department?: string;
  matricNumber?: string;
  isActive?: boolean;
}

export const createUser = async (options: CreateUserOptions): Promise<IUser> => {
  return User.create({
    name: options.name ?? 'Test User',
    email: options.email,
    password: options.password ?? 'Password123!',
    role: options.role,
    department: options.department ?? 'Department of Computer Science',
    matricNumber: options.matricNumber,
    isActive: options.isActive ?? true,
  });
};

export const tokenFor = (user: IUser): string => {
  return tokenService.generateTokens({
    userId: String(user._id),
    email: user.email,
    role: user.role,
  }).accessToken;
};

export const createUserWithToken = async (
  options: CreateUserOptions
): Promise<{ user: IUser; token: string }> => {
  const user = await createUser(options);
  return { user, token: tokenFor(user) };
};

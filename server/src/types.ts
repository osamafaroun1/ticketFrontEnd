export type RoleName = 'CIVIL' | 'ADMIN' | 'SUPERADMIN';

export type JwtUser = {
  userId: number;
  roleId: number;
  roleName: RoleName;
  provinceId: number | null;
  departmentId: number | null;
  username: string;
};

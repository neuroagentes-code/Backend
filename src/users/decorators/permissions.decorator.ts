import { SetMetadata } from '@nestjs/common';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export type Permission = {
  module: string;
  action: PermissionAction;
};

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Decoradores específicos para cada módulo
export const RequireUserPermission = (action: PermissionAction) =>
  RequirePermissions({ module: 'users', action });

export const RequireAgentPermission = (action: PermissionAction) =>
  RequirePermissions({ module: 'agents', action });

export const RequireIntegrationPermission = (action: PermissionAction) =>
  RequirePermissions({ module: 'integrations', action });

export const RequireChannelPermission = (action: PermissionAction) =>
  RequirePermissions({ module: 'channels', action });

export const RequireSubscriptionPermission = (action: PermissionAction) =>
  RequirePermissions({ module: 'subscriptions', action });

export const RequireProfilePermission = (action: PermissionAction) =>
  RequirePermissions({ module: 'profile', action });

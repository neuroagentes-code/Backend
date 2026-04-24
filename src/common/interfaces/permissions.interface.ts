/**
 * 🔐 Interface para permisos de usuario por módulo
 * Define la estructura de permisos para cada módulo del sistema
 */
export interface UserPermissions {
  agents: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  integrations: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  channels: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  users: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  subscriptions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  profile: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}
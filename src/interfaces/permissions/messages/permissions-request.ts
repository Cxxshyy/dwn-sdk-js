import type { AuthCreateOptions, Authorizable, AuthVerificationResult } from '../../../core/types';
import type { PermissionConditions, PermissionScope } from '../types';
import type { PermissionsRequestDescriptor, PermissionsRequestMessage } from '../types';

import { canonicalAuth } from '../../../core/auth';
import { DidResolver } from '../../../did/did-resolver';
import { getCurrentDateInHighPrecision } from '../../../utils/time';
import { Message } from '../../../core/message';
import { MessageStore } from '../../../store/message-store';
import { v4 as uuidv4 } from 'uuid';

type PermissionsRequestOptions = AuthCreateOptions & {
  target: string;
  dateCreated?: string;
  conditions?: PermissionConditions;
  description: string;
  grantedTo: string;
  grantedBy: string;
  objectId?: string;
  scope: PermissionScope;
};

export class PermissionsRequest extends Message implements Authorizable {
  readonly message: PermissionsRequestMessage; // a more specific type than the base type defined in parent class

  private constructor(message: PermissionsRequestMessage) {
    super(message);
  }

  public static async parse(message: PermissionsRequestMessage): Promise<PermissionsRequest> {
    return new PermissionsRequest(message);
  }

  public static async create(options: PermissionsRequestOptions): Promise<PermissionsRequest> {
    const { conditions } = options;
    const providedConditions = conditions ? conditions : {};
    const mergedConditions = { ...DEFAULT_CONDITIONS, ...providedConditions };

    const descriptor: PermissionsRequestDescriptor = {
      dateCreated : options.dateCreated ?? getCurrentDateInHighPrecision(),
      conditions  : mergedConditions,
      description : options.description,
      grantedTo   : options.grantedTo,
      grantedBy   : options.grantedBy,
      method      : 'PermissionsRequest',
      objectId    : options.objectId ? options.objectId : uuidv4(),
      scope       : options.scope,
    };

    Message.validateJsonSchema({ descriptor, authorization: { } });

    const auth = await Message.signAsAuthorization(options.target, descriptor, options.signatureInput);
    const message: PermissionsRequestMessage = { descriptor, authorization: auth };

    return new PermissionsRequest(message);
  }

  async verifyAuth(didResolver: DidResolver, _messageStore: MessageStore): Promise<AuthVerificationResult> {
    return await canonicalAuth(this, didResolver);
  }

  get id(): string {
    return this.message.descriptor.objectId;
  }

  get conditions(): PermissionConditions {
    return this.message.descriptor.conditions;
  }

  get grantedBy(): string {
    return this.message.descriptor.grantedBy;
  }

  get grantedTo(): string {
    return this.message.descriptor.grantedTo;
  }

  get description(): string {
    return this.message.descriptor.description;
  }

  get scope(): PermissionScope {
    return this.message.descriptor.scope;
  }
}

export const DEFAULT_CONDITIONS: PermissionConditions = {
  attestation  : 'optional',
  delegation   : false,
  encryption   : 'optional',
  publication  : false,
  sharedAccess : false
};
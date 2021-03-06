import { OnlyInstantiableByContainer, Singleton } from 'typescript-ioc';
import * as fs from 'fs';
import * as path from 'path';
import { FabricId } from '../../../common/models/AliasTypes';
import { LogLevel } from '../lib/Logger';

export interface ServerConfig {
    host: string;
    port: number;
}

export interface FabricConfig {
    fabricId: FabricId;
    name: string;
    image: string;
    hideFromInitialSelection?: boolean;
}

export interface AuthenticationConfig {
    server: {[token: string]: string};
    user?: AuthenticationUserConfig;

}

export interface AuthenticationUserConfig {
    userTokenExpirationTime: string;
    userTokenSharedKey: string;
    allowedUsersFileName?: string;
    identityProvider: IdentityProviderConfig;
}

export interface IdentityProviderConfig {
    type: 'LDAP';
}

export interface LdapConfig extends IdentityProviderConfig {
    url: string;
    allowedUsersFileName: string;
    queryString: string;
}

export interface InfluxDbConfig {
    host: string;
    database: string;
}

export interface MongoDbConfig {
    host: string;
    database: string;
}

export interface IConfig {
    server: ServerConfig;
    fabrics: FabricConfig[];
    authentication: AuthenticationConfig;
    influxDb: InfluxDbConfig;
    mongoDb: MongoDbConfig;
    logLevel: string;
}

function niceStringifyJson(data: any): string {
    return `${JSON.stringify(data, null, '    ')}\n`;
}

@Singleton
@OnlyInstantiableByContainer
export class ConfigService {
    private static readonly configPath = '../../../config/apiServer.json';
    private config: IConfig;

    constructor() {
        this.loadAndResaveConfig();
    }

    public getServerConfig(): ServerConfig {
        return this.config.server;
    }

    public getFabricConfigs(): FabricConfig[] {
        return this.config.fabrics;
    }

    public getFabricConfig(fabricId: string): FabricConfig {
        return this.config.fabrics.find(f => f.fabricId === fabricId);
    }

    public getAuthenticationConfig(): AuthenticationConfig {
        return this.config.authentication;
    }

    public getInfluxDbConfig(): InfluxDbConfig {
        return this.config.influxDb;
    }

    public getMongoDbConfig(): MongoDbConfig {
        return this.config.mongoDb;
    }

    public getLogLevelAsString(): string {
        return this.config.logLevel;
    }

    private loadAndResaveConfig() {
        const absPath = path.resolve(__dirname, ConfigService.configPath);
        this.config = JSON.parse(fs.readFileSync(absPath, 'utf8'));
        this.applyPatches();
        try {
            fs.writeFileSync(absPath, niceStringifyJson(this.config), 'utf8');
        } catch (e) {
            // Ignored. Maybe the file is write protected
        }
    }

    /**
     * This function is used to apply patches to the config.
     * For example when the log levels were introduced, but not all configs had it set.
     */
    private applyPatches() {
        this.applyPatchLogLevel();
    }

    private applyPatchLogLevel() {
        if (!this.config.logLevel) {
            this.config.logLevel = LogLevel[LogLevel.Info];
        }
    }
}

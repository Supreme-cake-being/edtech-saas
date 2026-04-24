import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import configuration from './config/configuration';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { ProcessingModule } from './processing/processing.module';

/** Custom DataSource — passes Authorization header to subgraph */
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    const token = context?.req?.headers?.authorization;
    if (token) {
      request.http.headers.set('authorization', token);
      console.log('Token forwarded:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in context');
    }
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
      }),
    }),
    GraphQLModule.forRootAsync<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        server: {
          context: ({ req }: { req: any }) => ({ req }),
          subscriptions: {
            'graphql-ws': true,
          },
        },
        gateway: {
          buildService: ({ url }) => new AuthenticatedDataSource({ url }),
          supergraphSdl: new IntrospectAndCompose({
            subgraphs: [
              {
                name: 'core',
                url: config.get<string>('subgraphs.coreService')!,
              },
            ],
          }),
        },
      }),
    }),
    ProcessingModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}

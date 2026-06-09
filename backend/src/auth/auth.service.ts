import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, WorkSpace } from 'generated/prisma';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async checkLicense(license: string): Promise<{
    success: boolean;
    message: string;
    workspace?: WorkSpace;
  }> {
    const workspace = await this.prisma.workSpace.findFirst({
      where: { license },
    });
    if (workspace) {
      return {
        message: 'License Exists',
        success: true,
        workspace,
      };
    }
    return {
      message: 'License does not exists',
      success: false,
    };
  }

  async checkWorkspace(name: string): Promise<{
    success: boolean;
    message: string;
    workspace?: WorkSpace;
  }> {
    const workspace = await this.prisma.workSpace.findFirst({
      where: { name },
    });
    if (workspace) {
      return {
        message: 'Workspace Exists',
        success: true,
        workspace,
      };
    }
    return {
      message: 'Workspace does not exists',
      success: true,
    };
  }

  async validateLogin(
    workspace: string,
    email: string,
  ): Promise<{
    success: boolean;
    message: string;
    user?: User;
  }> {
    const data = await this.prisma.user.findFirst({
      where: {
        email: email,
        workSpace: {
          name: workspace,
        },
      },
      include: {
        workSpace: true,
      },
    });
    if (data && data.id) {
      const otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
      const response = await axios.post(
        `${data.workSpace.apiurl}/social/public/updateuser`,
        {
          id: data.userId,
          AuthCode: process.env.AUTH_CODE,
          LicenseNumber: data.license,
          AuthCodeDesk: otp,
        },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      if (response.data.ApiResponse && response.data.ApiResponse == 'Success') {
        await this.prisma.user.update({
          where: { id: data.id },
          data: { password: otp.toString() },
        });
      }
      return {
        message: 'Validated successfully',
        success: true,
        user: data,
      };
    }
    return {
      message: 'Something went wrong',
      success: false,
    };
  }

  async verifyLoginCode(
    auth_code: string,
    id: string,
  ): Promise<{
    success: boolean;
    message: string;
    user?: User;
  }> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: id,
        password: auth_code,
      },
      include: {
        workSpace: true,
      },
    });
    if (user && user.id) {
      await axios.post(
        `${user.workSpace.apiurl}/social/public/updateuser`,
        {
          id: user.userId,
          AuthCode: process.env.AUTH_CODE,
          LicenseNumber: user.license,
          AuthCodeDesk: '',
        },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
    }
    if (user) {
      return {
        message: 'Code verified successfully',
        success: true,
        user: user,
      };
    }
    return {
      message: 'Code did not matched',
      success: false,
    };
  }

  async sendAuthCode(
    license: string,
    apiurl: string,
    user_id: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const response = await axios.post(
      `${apiurl}/social/public/updateuser`,
      {
        id: user_id,
        AuthCode: process.env.AUTH_CODE,
        LicenseNumber: license,
        AuthCodeDesk: otp,
      },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    if (response.data.ApiResponse && response.data.ApiResponse == 'Success') {
      return {
        message: otp.toString(),
        success: false,
      };
    }
    return {
      message: 'Error',
      success: true,
    };
  }

  async verifyAuthCode(
    workspace: string,
    user_id: string,
    user_name: string,
    user_email: string,
    license: string,
    auth_code: string,
    apiurl: string,
  ): Promise<{
    success: boolean;
    message: string;
    user?: User;
  }> {
    const prisma = this.prisma;
    const workSpace = await prisma.workSpace.create({
      data: {
        name: workspace,
        license: license,
        apiurl: apiurl,
      },
    });
    if (workSpace.id) {
      const user = await prisma.user.create({
        data: {
          name: user_name,
          email: user_email,
          license: license,
          workSpaceId: workSpace.id,
          password: auth_code,
          userId: user_id,
        },
      });
      if (user.id) {
        await prisma.workSpace.update({
          where: { id: workSpace.id },
          data: {
            createdById: user.id,
          },
        });
        await axios.post(
          `${apiurl}/social/public/updateuser`,
          {
            id: user_id,
            AuthCode: process.env.AUTH_CODE,
            LicenseNumber: license,
            AuthCodeDesk: '',
          },
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        await axios.post(
          `${apiurl}/social/public/updatesubscription`,
          {
            id: user_id,
            AuthCode: process.env.AUTH_CODE,
            LicenseNumber: license,
            Workspace: workspace,
            WorkspaceID: workSpace.id,
          },
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        const usersList = await axios.post(
          `${apiurl}/social/public/getuserlist`,
          {
            AuthCode: process.env.AUTH_CODE,
            LicenseNumber: license,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        if (
          usersList.data.ApiResponse &&
          usersList.data.ApiResponse == 'Success'
        ) {
          usersList.data.Data.map(async function (value: any) {
            if (value._id != user_id) {
              await prisma.user.create({
                data: {
                  name: value.Name,
                  email: value.EmailID,
                  contact: value.ContactNumber,
                  image: value.ProfilePic,
                  license: license,
                  workSpaceId: workSpace.id,
                  userId: value._id,
                },
              });
            }
          });
        }
      }
      return {
        user: user,
        message: 'Verified successfully',
        success: true,
      };
    }
    return {
      message: 'Workspace not found',
      success: true,
    };
  }

  async signIn(
    email: string,
    pass: string,
  ): Promise<{
    access_token?: string;
    success: boolean;
    message: string;
    role?: string;
  }> {
    if (!email || !pass) {
      return {
        success: false,
        message: 'Email and password are required',
      };
    }
    const user = await this.prisma.user.findFirst({ where: { email: email } });
    if (!user || user.password != pass) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }
    const { password, ...payload } = user;
    return {
      // 💡 Here the JWT secret key that's used for signing the payload
      // is the key that was passsed in the JwtModule
      access_token: await this.jwtService.signAsync(payload),
      message: 'Logged in successfully',
      success: true,
    };
  }
}

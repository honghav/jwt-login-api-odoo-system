import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/createCustomer.dto';
import { UpdateCustomerDto } from './dto/updateCustomer.dto';

@ApiTags('Customers') // Group endpoints together in Swagger UI
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Telegram customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'Customer created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() dto: CreateCustomerDto) {
    return await this.customerService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({
    status: 200,
    description: 'Return list of all customers ordered by creation date.',
  })
  async getAll() {
    return await this.customerService.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific customer by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUID or string identifier of the customer',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Customer found.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  async getOne(@Param('id') id: string) {
    return await this.customerService.getOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific customer by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUID or string identifier of the customer',
    type: String,
  })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ status: 200, description: 'Customer updated successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return await this.customerService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific customer by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUID or string identifier of the customer to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  async remove(@Param('id') id: string) {
    return await this.customerService.remove(id);
  }
}

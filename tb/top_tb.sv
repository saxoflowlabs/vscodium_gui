module top_tb;
  logic clk = 0;
  always #5 clk = ~clk;

  top dut(.clk(clk));

  initial begin
    #100 $finish;
  end
endmodule
